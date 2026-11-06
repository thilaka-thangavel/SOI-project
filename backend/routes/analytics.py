from datetime import datetime, timedelta
from collections import defaultdict
from flask import Blueprint, jsonify
from models import db, Location, RainfallRecord, HistoricalIncident, CitizenReport, DrainageRecord, RiskAssessment, Inspection

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/analytics", methods=["GET"])
def get_analytics():
    """Return analytics data for municipal engineering and policy teams."""
    locations = Location.query.all()

    # 1. Rainfall vs Incidents — group by date across all locations
    cutoff = datetime.utcnow() - timedelta(days=14)
    rainfall_records = RainfallRecord.query.filter(
        RainfallRecord.timestamp >= cutoff
    ).order_by(RainfallRecord.timestamp.asc()).all()

    all_reports = CitizenReport.query.all()

    # Build daily rainfall averages
    daily_rain = defaultdict(list)
    for r in rainfall_records:
        day = r.timestamp.strftime("%m/%d")
        daily_rain[day].append(r.amount_mm)

    # Build daily report counts
    daily_reports = defaultdict(int)
    for rep in all_reports:
        if rep.reported_at:
            day = rep.reported_at.strftime("%m/%d")
            daily_reports[day] += 1

    all_days = sorted(set(list(daily_rain.keys()) + list(daily_reports.keys())))
    rainfall_vs_incidents = [
        {
            "date": day,
            "rainfall_mm": round(sum(daily_rain[day]) / len(daily_rain[day]), 1) if daily_rain[day] else 0.0,
            "incident_count": daily_reports[day],
        }
        for day in all_days
    ]

    # 2. Reports by area
    area_reports_map = defaultdict(lambda: {"total": 0, "severe": 0, "verified": 0})
    for rep in all_reports:
        loc = Location.query.get(rep.location_id) if rep.location_id else None
        area_name = (loc.area if loc else None) or "Unassigned"
        area_reports_map[area_name]["total"] += 1
        if rep.water_depth == "severe":
            area_reports_map[area_name]["severe"] += 1
        if rep.is_verified:
            area_reports_map[area_name]["verified"] += 1

    reports_by_area = [
        {"area": area, "count": d["total"], "severe_count": d["severe"], "verified_count": d["verified"]}
        for area, d in sorted(area_reports_map.items(), key=lambda x: x[1]["total"], reverse=True)
    ]

    # 3. Drainage blockage frequency
    drainage_records = DrainageRecord.query.all()
    condition_counts = defaultdict(int)
    for d in drainage_records:
        cond = d.condition or "unknown"
        condition_counts[cond] += 1

    drainage_blockage_frequency = [
        {"condition": cond, "count": cnt}
        for cond, cnt in condition_counts.items()
    ]

    # 4. Risk distribution over time — group by date, show category counts
    assessments = RiskAssessment.query.order_by(RiskAssessment.assessed_at.asc()).all()
    time_map = defaultdict(lambda: {"low": 0, "moderate": 0, "high": 0, "critical": 0})
    for a in assessments:
        dt_str = a.assessed_at.strftime("%m/%d")
        cat = a.risk_category or "low"
        if cat in time_map[dt_str]:
            time_map[dt_str][cat] += 1

    risk_over_time = [
        {"date": dt_str, "low": d["low"], "moderate": d["moderate"], "high": d["high"], "critical": d["critical"]}
        for dt_str, d in sorted(time_map.items())
    ]

    # 5. Inspection completion rate
    total_inspections = Inspection.query.count()
    completed_inspections = Inspection.query.filter_by(status="completed").count()
    inspection_completion_rate = (
        round(completed_inspections / total_inspections, 3)
        if total_inspections > 0
        else 0.0
    )

    # 6. Verified vs unverified
    verified_count = CitizenReport.query.filter_by(is_verified=True).count()
    unverified_count = CitizenReport.query.filter_by(is_verified=False).count()

    return jsonify({
        "rainfall_vs_incidents": rainfall_vs_incidents,
        "reports_by_area": reports_by_area,
        "drainage_blockage_frequency": drainage_blockage_frequency,
        "risk_over_time": risk_over_time,
        "inspection_completion_rate": inspection_completion_rate,
        "verified_vs_unverified": {
            "verified": verified_count,
            "unverified": unverified_count,
        },
    })
