from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from dateutil import parser as date_parser
from models import db, RainfallRecord, Location
from risk_engine import calculate_risk

rainfall_bp = Blueprint("rainfall", __name__)

def determine_intensity(amount_mm):
    if amount_mm <= 10.0:
        return "low"
    elif amount_mm <= 25.0:
        return "moderate"
    elif amount_mm <= 50.0:
        return "heavy"
    return "very_heavy"

@rainfall_bp.route("/rainfall", methods=["GET"])
def get_rainfall():
    """List rainfall records, supporting ?location_id=&limit=&days= query params."""
    location_id = request.args.get("location_id", type=int)
    limit = request.args.get("limit", default=100, type=int)
    days = request.args.get("days", type=int)

    query = RainfallRecord.query

    if location_id:
        query = query.filter(RainfallRecord.location_id == location_id)

    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(RainfallRecord.timestamp >= cutoff)

    records = query.order_by(RainfallRecord.timestamp.desc()).limit(limit).all()
    return jsonify([r.to_dict() for r in records])

@rainfall_bp.route("/rainfall", methods=["POST"])
def create_rainfall():
    """Create a new rainfall record and update risk score."""
    data = request.get_json() or {}
    location_id = data.get("location_id")
    amount_mm = data.get("amount_mm")

    if location_id is None or amount_mm is None:
        return jsonify({"error": "location_id and amount_mm are required fields"}), 400

    try:
        amount_mm = float(amount_mm)
    except (ValueError, TypeError):
        return jsonify({"error": "amount_mm must be a valid number"}), 400

    location = Location.query.get(location_id)
    if not location:
        return jsonify({"error": f"Location {location_id} not found"}), 404

    timestamp = datetime.utcnow()
    if data.get("timestamp"):
        try:
            timestamp = date_parser.parse(data["timestamp"])
        except Exception:
            pass

    intensity = data.get("intensity") or determine_intensity(amount_mm)
    source_type = data.get("source_type", "manual_entry")
    data_status = data.get("data_status", "verified")
    is_synthetic = data.get("is_synthetic", False)

    record = RainfallRecord(
        location_id=location_id,
        timestamp=timestamp,
        amount_mm=amount_mm,
        intensity=intensity,
        source_type=source_type,
        data_status=data_status,
        is_synthetic=is_synthetic,
        created_at=datetime.utcnow(),
    )
    db.session.add(record)
    db.session.commit()

    # Automatically recalculate risk for location
    try:
        calculate_risk(location_id)
    except Exception:
        pass

    return jsonify(record.to_dict()), 201
