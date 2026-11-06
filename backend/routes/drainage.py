from datetime import datetime
from flask import Blueprint, request, jsonify
from dateutil import parser as date_parser
from models import db, DrainageRecord, Location
from risk_engine import calculate_risk

drainage_bp = Blueprint("drainage", __name__)

@drainage_bp.route("/drainage", methods=["GET"])
def get_drainage():
    """List all drainage records with location info."""
    location_id = request.args.get("location_id", type=int)
    condition = request.args.get("condition")

    query = DrainageRecord.query
    if location_id:
        query = query.filter(DrainageRecord.location_id == location_id)
    if condition:
        query = query.filter(DrainageRecord.condition == condition)

    records = query.order_by(DrainageRecord.updated_at.desc()).all()
    result = []
    for r in records:
        d = r.to_dict()
        loc = Location.query.get(r.location_id)
        d["location_name"] = loc.name if loc else "Unknown"
        d["location_area"] = loc.area if loc else "Unknown"
        result.append(d)
    return jsonify(result)

@drainage_bp.route("/drainage", methods=["POST"])
def create_drainage():
    """Create a new drainage record."""
    data = request.get_json() or {}
    location_id = data.get("location_id")
    if not location_id:
        return jsonify({"error": "location_id is required"}), 400

    location = Location.query.get(location_id)
    if not location:
        return jsonify({"error": f"Location {location_id} not found"}), 404

    condition = data.get("condition", "clear")
    blockage_status = data.get("blockage_status", condition == "blocked")
    maintenance_status = data.get("maintenance_status", "good")
    drain_type = data.get("drain_type", "stormwater")
    supporting_report = data.get("supporting_report", "")
    updated_by = data.get("updated_by", "Municipal Officer")

    last_inspection_date = datetime.utcnow()
    if data.get("last_inspection_date"):
        try:
            last_inspection_date = date_parser.parse(data["last_inspection_date"])
        except Exception:
            pass

    record = DrainageRecord(
        location_id=location_id,
        drain_type=drain_type,
        condition=condition,
        blockage_status=blockage_status,
        last_inspection_date=last_inspection_date,
        maintenance_status=maintenance_status,
        supporting_report=supporting_report,
        updated_by=updated_by,
        is_synthetic=data.get("is_synthetic", False),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(record)
    db.session.commit()

    # Recalculate risk for this location
    try:
        calculate_risk(location_id)
    except Exception:
        pass

    res = record.to_dict()
    res["location_name"] = location.name
    res["location_area"] = location.area
    return jsonify(res), 201

@drainage_bp.route("/drainage/<int:record_id>", methods=["PUT"])
def update_drainage(record_id):
    """Update drainage condition (for municipal officers)."""
    record = DrainageRecord.query.get(record_id)
    if not record:
        return jsonify({"error": f"Drainage record {record_id} not found"}), 404

    data = request.get_json() or {}

    if "condition" in data:
        record.condition = data["condition"]
        if "blockage_status" not in data:
            record.blockage_status = data["condition"] == "blocked"

    if "blockage_status" in data:
        record.blockage_status = bool(data["blockage_status"])

    if "maintenance_status" in data:
        record.maintenance_status = data["maintenance_status"]

    if "drain_type" in data:
        record.drain_type = data["drain_type"]

    if "supporting_report" in data:
        record.supporting_report = data["supporting_report"]

    if "updated_by" in data:
        record.updated_by = data["updated_by"]

    if "last_inspection_date" in data and data["last_inspection_date"]:
        try:
            record.last_inspection_date = date_parser.parse(data["last_inspection_date"])
        except Exception:
            record.last_inspection_date = datetime.utcnow()
    else:
        record.last_inspection_date = datetime.utcnow()

    record.updated_at = datetime.utcnow()
    db.session.commit()

    # Recalculate risk score
    try:
        calculate_risk(record.location_id)
    except Exception:
        pass

    loc = Location.query.get(record.location_id)
    res = record.to_dict()
    res["location_name"] = loc.name if loc else "Unknown"
    res["location_area"] = loc.area if loc else "Unknown"
    return jsonify(res)
