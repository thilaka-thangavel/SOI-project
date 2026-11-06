from datetime import datetime
from flask import Blueprint, request, jsonify
from dateutil import parser as date_parser
from models import db, Inspection, Location, RiskAssessment, DrainageRecord
from risk_engine import calculate_risk

inspections_bp = Blueprint("inspections", __name__)

@inspections_bp.route("/inspections", methods=["GET"])
def get_inspections():
    """List all inspections, supporting status, priority, and location_id filters."""
    status = request.args.get("status")
    priority = request.args.get("priority")
    location_id = request.args.get("location_id", type=int)

    query = Inspection.query
    if status:
        query = query.filter(Inspection.status == status)
    if priority:
        query = query.filter(Inspection.priority == priority)
    if location_id:
        query = query.filter(Inspection.location_id == location_id)

    inspections = query.order_by(Inspection.scheduled_date.desc(), Inspection.created_at.desc()).all()
    result = []
    for ins in inspections:
        d = ins.to_dict()
        loc = Location.query.get(ins.location_id)
        d["location_name"] = loc.name if loc else "Unknown"
        d["location_area"] = loc.area if loc else "Unknown"
        result.append(d)
    return jsonify(result)

@inspections_bp.route("/inspections", methods=["POST"])
def create_inspection():
    """Create a new inspection task."""
    data = request.get_json() or {}
    location_id = data.get("location_id")
    title = data.get("title")

    if not location_id or not title:
        return jsonify({"error": "location_id and title are required fields"}), 400

    location = Location.query.get(location_id)
    if not location:
        return jsonify({"error": f"Location {location_id} not found"}), 404

    scheduled_date = datetime.utcnow()
    if data.get("scheduled_date"):
        try:
            scheduled_date = date_parser.parse(data["scheduled_date"])
        except Exception:
            pass

    # Link with latest risk assessment if not provided
    risk_assessment_id = data.get("risk_assessment_id")
    if not risk_assessment_id:
        latest_risk = (
            RiskAssessment.query.filter_by(location_id=location_id)
            .order_by(RiskAssessment.assessed_at.desc(), RiskAssessment.id.desc())
            .first()
        )
        if latest_risk:
            risk_assessment_id = latest_risk.id

    inspection = Inspection(
        location_id=location_id,
        risk_assessment_id=risk_assessment_id,
        title=title,
        status=data.get("status", "pending"),
        priority=data.get("priority", "medium"),
        assigned_to=data.get("assigned_to", "Field Inspector"),
        scheduled_date=scheduled_date,
        completed_date=None,
        findings=data.get("findings"),
        drain_condition_found=data.get("drain_condition_found"),
        flooding_confirmed=bool(data.get("flooding_confirmed", False)),
        issue_verified=data.get("issue_verified"),
        alert_incorrect=bool(data.get("alert_incorrect", False)),
        notes=data.get("notes"),
        created_by=data.get("created_by", "Officer"),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(inspection)
    db.session.commit()

    res = inspection.to_dict()
    res["location_name"] = location.name
    res["location_area"] = location.area
    return jsonify(res), 201

@inspections_bp.route("/inspections/<int:inspection_id>", methods=["PUT"])
def update_inspection(inspection_id):
    """Update inspection findings, status, and verification."""
    inspection = Inspection.query.get(inspection_id)
    if not inspection:
        return jsonify({"error": f"Inspection {inspection_id} not found"}), 404

    data = request.get_json() or {}

    if "status" in data:
        inspection.status = data["status"]
        if data["status"] == "completed" and not inspection.completed_date:
            inspection.completed_date = datetime.utcnow()

    if "priority" in data:
        inspection.priority = data["priority"]

    if "assigned_to" in data:
        inspection.assigned_to = data["assigned_to"]

    if "findings" in data:
        inspection.findings = data["findings"]

    if "notes" in data:
        inspection.notes = data["notes"]

    if "drain_condition_found" in data:
        inspection.drain_condition_found = data["drain_condition_found"]
        # Update or record drainage condition
        if data["drain_condition_found"]:
            latest_drainage = (
                DrainageRecord.query.filter_by(location_id=inspection.location_id)
                .order_by(DrainageRecord.updated_at.desc())
                .first()
            )
            if latest_drainage:
                latest_drainage.condition = data["drain_condition_found"]
                latest_drainage.blockage_status = data["drain_condition_found"] == "blocked"
                latest_drainage.last_inspection_date = datetime.utcnow()
                latest_drainage.updated_at = datetime.utcnow()
                latest_drainage.updated_by = inspection.assigned_to or "Inspector"

    if "flooding_confirmed" in data:
        # ONLY human can confirm flooding
        inspection.flooding_confirmed = bool(data["flooding_confirmed"])

    if "issue_verified" in data:
        inspection.issue_verified = bool(data["issue_verified"])

    if "alert_incorrect" in data:
        inspection.alert_incorrect = bool(data["alert_incorrect"])

    if "scheduled_date" in data and data["scheduled_date"]:
        try:
            inspection.scheduled_date = date_parser.parse(data["scheduled_date"])
        except Exception:
            pass

    if "completed_date" in data:
        if data["completed_date"]:
            try:
                inspection.completed_date = date_parser.parse(data["completed_date"])
            except Exception:
                inspection.completed_date = datetime.utcnow()
        else:
            inspection.completed_date = None

    inspection.updated_at = datetime.utcnow()
    db.session.commit()

    # Recalculate risk score in case drainage was updated
    try:
        calculate_risk(inspection.location_id)
    except Exception:
        pass

    loc = Location.query.get(inspection.location_id)
    res = inspection.to_dict()
    res["location_name"] = loc.name if loc else "Unknown"
    res["location_area"] = loc.area if loc else "Unknown"
    return jsonify(res)
