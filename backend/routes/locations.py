from flask import Blueprint, jsonify
from models import Location, RiskAssessment, RainfallRecord, DrainageRecord, CitizenReport, HistoricalIncident, Inspection

locations_bp = Blueprint("locations", __name__)

@locations_bp.route("/locations", methods=["GET"])
def get_locations():
    """List all locations with their latest risk assessment."""
    locations = Location.query.all()
    result = []
    for loc in locations:
        loc_data = loc.to_dict()
        latest_risk = (
            RiskAssessment.query.filter_by(location_id=loc.id)
            .order_by(RiskAssessment.assessed_at.desc(), RiskAssessment.id.desc())
            .first()
        )
        loc_data["latest_risk"] = latest_risk.to_dict() if latest_risk else None
        result.append(loc_data)
    return jsonify(result)

@locations_bp.route("/locations/<int:location_id>", methods=["GET"])
def get_location_details(location_id):
    """Get single location with full details (rainfall, drainage, reports, risk, incidents, inspections)."""
    loc = Location.query.get(location_id)
    if not loc:
        return jsonify({"error": f"Location {location_id} not found"}), 404

    loc_data = loc.to_dict()

    latest_risk = (
        RiskAssessment.query.filter_by(location_id=loc.id)
        .order_by(RiskAssessment.assessed_at.desc(), RiskAssessment.id.desc())
        .first()
    )
    loc_data["latest_risk"] = latest_risk.to_dict() if latest_risk else None

    # Risk history
    risk_history = (
        RiskAssessment.query.filter_by(location_id=loc.id)
        .order_by(RiskAssessment.assessed_at.desc(), RiskAssessment.id.desc())
        .limit(10)
        .all()
    )
    loc_data["risk_history"] = [r.to_dict() for r in risk_history]

    # Rainfall
    rainfall = (
        RainfallRecord.query.filter_by(location_id=loc.id)
        .order_by(RainfallRecord.timestamp.desc())
        .limit(20)
        .all()
    )
    loc_data["rainfall_records"] = [r.to_dict() for r in rainfall]

    # Drainage
    drainage = (
        DrainageRecord.query.filter_by(location_id=loc.id)
        .order_by(DrainageRecord.updated_at.desc())
        .all()
    )
    loc_data["drainage_records"] = [d.to_dict() for d in drainage]

    # Citizen Reports
    reports = (
        CitizenReport.query.filter_by(location_id=loc.id)
        .order_by(CitizenReport.reported_at.desc())
        .all()
    )
    loc_data["citizen_reports"] = [r.to_dict() for r in reports]

    # Historical Incidents
    incidents = (
        HistoricalIncident.query.filter_by(location_id=loc.id)
        .order_by(HistoricalIncident.incident_date.desc())
        .all()
    )
    loc_data["historical_incidents"] = [i.to_dict() for i in incidents]

    # Inspections
    inspections = (
        Inspection.query.filter_by(location_id=loc.id)
        .order_by(Inspection.created_at.desc())
        .all()
    )
    loc_data["inspections"] = [i.to_dict() for i in inspections]

    return jsonify(loc_data)
