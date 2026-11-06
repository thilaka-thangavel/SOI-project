from flask import Blueprint, request, jsonify
from models import Location, RiskAssessment
from risk_engine import calculate_risk, calculate_all_risks

risk_bp = Blueprint("risk", __name__)

@risk_bp.route("/risk-assessments", methods=["GET"])
def get_risk_assessments():
    """List all latest risk assessments per location."""
    locations = Location.query.all()
    results = []
    for loc in locations:
        latest = (
            RiskAssessment.query.filter_by(location_id=loc.id)
            .order_by(RiskAssessment.assessed_at.desc(), RiskAssessment.id.desc())
            .first()
        )
        if latest:
            d = latest.to_dict()
            d["location_name"] = loc.name
            d["location_area"] = loc.area
            d["latitude"] = loc.latitude
            d["longitude"] = loc.longitude
            results.append(d)
        else:
            # Fallback if no assessment exists yet
            results.append({
                "location_id": loc.id,
                "location_name": loc.name,
                "location_area": loc.area,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "risk_score": 0.0,
                "risk_category": "low",
                "confidence": 0.0,
                "risk_trend": "stable",
                "warning_triggered": False,
                "warning_message": None,
                "missing_data": ["all"],
            })
    return jsonify(results)

@risk_bp.route("/risk-assessments/calculate", methods=["POST"])
def recalculate_risk():
    """Recalculate risk for one location or all locations."""
    data = request.get_json() or {}
    location_id = data.get("location_id")

    if location_id is not None:
        loc = Location.query.get(location_id)
        if not loc:
            return jsonify({"error": f"Location {location_id} not found"}), 404

        assessment = calculate_risk(location_id)
        return jsonify({
            "status": "success",
            "message": f"Risk assessment recalculated for {loc.name}",
            "assessment": assessment,
        })
    else:
        assessments = calculate_all_risks()
        return jsonify({
            "status": "success",
            "message": f"Risk assessment recalculated for {len(assessments)} locations",
            "count": len(assessments),
            "assessments": assessments,
        })
