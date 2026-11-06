from datetime import datetime
from flask import Blueprint, request, jsonify
from dateutil import parser as date_parser
from models import db, CitizenReport, Location
from risk_engine import calculate_risk

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/reports", methods=["GET"])
def get_reports():
    """List citizen reports with optional filters (location_id, status, verified)."""
    location_id = request.args.get("location_id", type=int)
    status = request.args.get("status")
    verified = request.args.get("verified")

    query = CitizenReport.query
    if location_id:
        query = query.filter(CitizenReport.location_id == location_id)
    if status:
        query = query.filter(CitizenReport.status == status)
    if verified is not None:
        is_ver = verified.lower() in ["true", "1", "yes"]
        query = query.filter(CitizenReport.is_verified == is_ver)

    reports = query.order_by(CitizenReport.reported_at.desc()).all()
    result = []
    for r in reports:
        d = r.to_dict()
        if r.location_id:
            loc = Location.query.get(r.location_id)
            d["location_name"] = loc.name if loc else r.location_text
            d["location_area"] = loc.area if loc else None
        else:
            d["location_name"] = r.location_text
            d["location_area"] = None
        result.append(d)
    return jsonify(result)

@reports_bp.route("/reports", methods=["POST"])
def create_report():
    """Submit a new citizen report."""
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"error": "title is a required field"}), 400

    location_id = data.get("location_id")
    location = None
    if location_id:
        location = Location.query.get(location_id)
        if not location:
            return jsonify({"error": f"Location {location_id} not found"}), 404

    reported_at = datetime.utcnow()
    if data.get("reported_at"):
        try:
            reported_at = date_parser.parse(data["reported_at"])
        except Exception:
            pass

    lat = data.get("latitude")
    lon = data.get("longitude")
    if location and (lat is None or lon is None):
        lat = location.latitude
        lon = location.longitude

    location_text = data.get("location_text")
    if not location_text and location:
        location_text = location.name

    report = CitizenReport(
        title=title,
        description=data.get("description", ""),
        location_id=location_id,
        location_text=location_text,
        issue_type=data.get("issue_type", "water_accumulation"),
        water_depth=data.get("water_depth", "shallow"),
        reported_at=reported_at,
        latitude=lat,
        longitude=lon,
        photo_path=data.get("photo_path"),
        is_verified=data.get("is_verified", False),
        verified_by=data.get("verified_by"),
        verified_at=datetime.utcnow() if data.get("is_verified") else None,
        status=data.get("status", "pending"),
        is_synthetic=data.get("is_synthetic", False),
        created_at=datetime.utcnow(),
    )
    db.session.add(report)
    db.session.commit()

    if location_id:
        try:
            calculate_risk(location_id)
        except Exception:
            pass

    res = report.to_dict()
    res["location_name"] = location.name if location else location_text
    return jsonify(res), 201

@reports_bp.route("/issues", methods=["GET"])
def get_open_issues():
    """Return all open issues (reports with status='pending' or 'under_review')."""
    issues = (
        CitizenReport.query.filter(CitizenReport.status.in_(["pending", "under_review"]))
        .order_by(CitizenReport.reported_at.desc())
        .all()
    )
    result = []
    for r in issues:
        d = r.to_dict()
        if r.location_id:
            loc = Location.query.get(r.location_id)
            d["location_name"] = loc.name if loc else r.location_text
            d["location_area"] = loc.area if loc else None
        else:
            d["location_name"] = r.location_text
            d["location_area"] = None
        result.append(d)
    return jsonify(result)
