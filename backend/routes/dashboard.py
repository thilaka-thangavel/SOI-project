from datetime import datetime, timedelta
from collections import defaultdict
from flask import Blueprint, jsonify
from models import db, Location, RiskAssessment, DrainageRecord, CitizenReport, Inspection, RainfallRecord

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    """Return comprehensive summary metrics for the municipal dashboard."""
    locations = Location.query.all()
    locations_monitored = len(locations)

    # Latest risk assessment per location
    latest_assessments = {}
    for loc in locations:
        latest = (
            RiskAssessment.query.filter_by(location_id=loc.id)
            .order_by(RiskAssessment.assessed_at.desc(), RiskAssessment.id.desc())
            .first()
        )
        if latest:
            latest_assessments[loc.id] = latest

    # Risk counts & distribution
    category_counts = {"low": 0, "moderate": 0, "high": 0, "critical": 0}
    high_risk_locations = []

    for loc in locations:
        ass = latest_assessments.get(loc.id)
        if ass:
            cat = ass.risk_category
            category_counts[cat] = category_counts.get(cat, 0) + 1

            if cat in ["high", "critical"]:
                # Get latest rainfall record
                latest_rain = (
                    RainfallRecord.query.filter_by(location_id=loc.id)
                    .order_by(RainfallRecord.timestamp.desc())
                    .first()
                )
                # Get latest drainage record
                latest_drain = (
                    DrainageRecord.query.filter_by(location_id=loc.id)
                    .order_by(DrainageRecord.updated_at.desc())
                    .first()
                )

                high_risk_locations.append({
                    "id": loc.id,
                    "name": loc.name,
                    "area": loc.area,
                    "rainfall_intensity": latest_rain.intensity if latest_rain else "unknown",
                    "drainage_condition": latest_drain.condition if latest_drain else "unknown",
                    "historical_frequency": loc.historical_waterlogging_frequency,
                    "risk_score": ass.risk_score,
                    "risk_category": ass.risk_category,
                    "warning_triggered": ass.warning_triggered,
                    "warning_message": ass.warning_message,
                    "last_updated": ass.assessed_at.isoformat() if ass.assessed_at else None,
                })
        else:
            category_counts["low"] += 1

    high_risk_locations.sort(key=lambda x: x["risk_score"], reverse=True)

    high_risk_count = category_counts["high"]
    critical_count = category_counts["critical"]

    # Blocked drainage count (from most recent record per location)
    drainage_blockages = 0
    for loc in locations:
        latest_drain = (
            DrainageRecord.query.filter_by(location_id=loc.id)
            .order_by(DrainageRecord.updated_at.desc())
            .first()
        )
        if latest_drain and (latest_drain.blockage_status or latest_drain.condition == "blocked"):
            drainage_blockages += 1

    # Citizen reports total
    citizen_reports_total = CitizenReport.query.count()

    # Inspections pending or in progress
    inspections_pending = Inspection.query.filter(
        Inspection.status.in_(["pending", "in_progress"])
    ).count()

    # Risk distribution array
    risk_distribution = [
        {"category": "low", "count": category_counts["low"]},
        {"category": "moderate", "count": category_counts["moderate"]},
        {"category": "high", "count": category_counts["high"]},
        {"category": "critical", "count": category_counts["critical"]},
    ]

    # Rainfall chart: last 7 days grouped by date
    cutoff_7d = datetime.utcnow() - timedelta(days=7)
    recent_rain = (
        RainfallRecord.query.filter(RainfallRecord.timestamp >= cutoff_7d)
        .order_by(RainfallRecord.timestamp.asc())
        .all()
    )

    day_map = defaultdict(lambda: {"amounts": [], "locations": set()})
    # Ensure all past 7 days exist in day_map in order
    for d in range(6, -1, -1):
        dt_str = (datetime.utcnow() - timedelta(days=d)).strftime("%Y-%m-%d")
        _ = day_map[dt_str]

    for r in recent_rain:
        dt_str = r.timestamp.strftime("%Y-%m-%d")
        day_map[dt_str]["amounts"].append(r.amount_mm)
        day_map[dt_str]["locations"].add(r.location_id)

    rainfall_chart = []
    for dt_str in sorted(day_map.keys()):
        data = day_map[dt_str]
        amts = data["amounts"]
        if amts:
            avg_amt = round(sum(amts) / len(amts), 1)
            max_amt = round(max(amts), 1)
        else:
            avg_amt = 0.0
            max_amt = 0.0
        rainfall_chart.append({
            "timestamp": dt_str,
            "avg_amount": avg_amt,
            "max_amount": max_amt,
            "location_count": len(data["locations"]),
        })

    # Recent activity stream
    recent_activity = []

    # 1. Recent reports
    recent_reports = CitizenReport.query.order_by(CitizenReport.reported_at.desc()).limit(6).all()
    for rep in recent_reports:
        loc = Location.query.get(rep.location_id) if rep.location_id else None
        loc_name = loc.name if loc else (rep.location_text or "General Area")
        severity_map = {
            "severe": "critical",
            "moderate": "high",
            "shallow": "moderate",
            "no_standing_water": "low",
            "unknown": "moderate",
        }
        recent_activity.append({
            "type": "report",
            "title": f"Report: {rep.title}",
            "description": f"{loc_name} - {rep.description or 'No description provided'}",
            "timestamp": rep.reported_at.isoformat() if rep.reported_at else None,
            "severity": severity_map.get(rep.water_depth, "moderate"),
            "_dt": rep.reported_at or datetime.min,
        })

    # 2. Recent drainage updates
    recent_drainage = DrainageRecord.query.order_by(DrainageRecord.updated_at.desc()).limit(6).all()
    for dr in recent_drainage:
        loc = Location.query.get(dr.location_id)
        loc_name = loc.name if loc else "Unknown"
        sev = "critical" if dr.condition == "blocked" else ("high" if dr.condition == "partially_blocked" else "low")
        recent_activity.append({
            "type": "drainage_update",
            "title": f"Drainage Updated: {loc_name}",
            "description": f"Condition is '{dr.condition.replace('_', ' ')}' for {dr.drain_type or 'drain'}. By {dr.updated_by or 'Officer'}.",
            "timestamp": dr.updated_at.isoformat() if dr.updated_at else None,
            "severity": sev,
            "_dt": dr.updated_at or datetime.min,
        })

    # 3. Recent inspections
    recent_inspections = Inspection.query.order_by(Inspection.updated_at.desc()).limit(6).all()
    for ins in recent_inspections:
        loc = Location.query.get(ins.location_id)
        loc_name = loc.name if loc else "Unknown"
        recent_activity.append({
            "type": "inspection",
            "title": f"Inspection: {ins.title}",
            "description": f"Status: {ins.status.upper()} | {loc_name} | {ins.findings or 'In progress'}",
            "timestamp": ins.updated_at.isoformat() if ins.updated_at else None,
            "severity": ins.priority or "medium",
            "_dt": ins.updated_at or datetime.min,
        })

    # Sort merged activities
    recent_activity.sort(key=lambda x: x["_dt"], reverse=True)
    # Remove internal _dt key
    for a in recent_activity:
        a.pop("_dt", None)
    recent_activity = recent_activity[:10]

    return jsonify({
        "locations_monitored": locations_monitored,
        "high_risk_count": high_risk_count,
        "critical_count": critical_count,
        "drainage_blockages": drainage_blockages,
        "citizen_reports_total": citizen_reports_total,
        "inspections_pending": inspections_pending,
        "high_risk_locations": high_risk_locations,
        "rainfall_chart": rainfall_chart,
        "risk_distribution": risk_distribution,
        "recent_activity": recent_activity,
    })
