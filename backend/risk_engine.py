import json
from datetime import datetime, timedelta
from models import db, Location, RainfallRecord, DrainageRecord, CitizenReport, RiskAssessment

WEIGHTS = {
    "rainfall": 0.35,
    "drainage": 0.25,
    "historical": 0.20,
    "elevation": 0.10,
    "reports": 0.10,
}

def score_rainfall(record):
    """
    Rainfall scoring:
      no_data -> score=0, mark missing
      low (0-10mm) -> 10
      moderate (10-25mm) -> 40
      heavy (25-50mm) -> 75
      very_heavy (>50mm) -> 100
    """
    if record is None:
        return 0.0, True, "no recent rainfall data"
    
    amount = record.amount_mm
    if amount <= 10.0:
        return 10.0, False, f"low rainfall ({amount:.1f}mm)"
    elif amount <= 25.0:
        return 40.0, False, f"moderate rainfall ({amount:.1f}mm)"
    elif amount <= 50.0:
        return 75.0, False, f"heavy rainfall ({amount:.1f}mm)"
    else:
        return 100.0, False, f"very heavy rainfall ({amount:.1f}mm)"

def score_drainage(record):
    """
    Drainage scoring:
      unknown/None -> score=50, mark missing, reduce confidence
      clear -> 0
      partially_blocked -> 50
      blocked -> 100
    """
    if record is None or not record.condition or record.condition.lower() == "unknown":
        return 50.0, True, "unknown drainage condition"
    
    cond = record.condition.lower()
    if cond == "clear":
        return 0.0, False, "clear drainage"
    elif cond == "partially_blocked":
        return 50.0, False, "partially blocked drainage"
    elif cond == "blocked":
        return 100.0, False, "blocked drainage"
    else:
        return 50.0, True, f"drainage condition ({cond})"

def score_historical(freq):
    """
    Historical scoring:
      rare -> 10
      occasional -> 35
      frequent -> 65
      very_frequent -> 90
    """
    if not freq:
        return 35.0, True, "unknown historical frequency"
    
    f = freq.lower()
    if f == "rare":
        return 10.0, False, "rare historical incidents"
    elif f == "occasional":
        return 35.0, False, "occasional historical incidents"
    elif f == "frequent":
        return 65.0, False, "frequent historical incidents"
    elif f == "very_frequent":
        return 90.0, False, "very frequent historical waterlogging"
    else:
        return 35.0, False, f"{freq} historical incidents"

def score_elevation(is_low_lying):
    """
    Elevation scoring:
      is_low_lying=True -> 100
      is_low_lying=False -> 0
    """
    if is_low_lying:
        return 100.0, "low-lying area"
    return 0.0, "elevated terrain"

def score_reports(count):
    """
    Reports scoring (count of recent reports in last 7 days):
      0 -> 0
      1 -> 30
      2-3 -> 60
      4+ -> 100
    """
    if count <= 0:
        return 0.0, "no recent citizen reports"
    elif count == 1:
        return 30.0, "1 recent citizen report"
    elif count <= 3:
        return 60.0, f"{count} recent citizen reports"
    else:
        return 100.0, f"{count} recent citizen reports"

def get_risk_category(score):
    if score >= 75.0:
        return "critical"
    elif score >= 50.0:
        return "high"
    elif score >= 25.0:
        return "moderate"
    else:
        return "low"

def calculate_risk(location_id):
    """
    Calculate waterlogging risk score for a single location.
    Persists RiskAssessment record to DB and returns dict representation.
    """
    location = Location.query.get(location_id)
    if not location:
        raise ValueError(f"Location with id {location_id} not found")

    missing_data = []

    # 1. Latest rainfall record within last 24h
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    latest_rainfall = (
        RainfallRecord.query.filter(
            RainfallRecord.location_id == location_id,
            RainfallRecord.timestamp >= cutoff_24h,
        )
        .order_by(RainfallRecord.timestamp.desc())
        .first()
    )
    # If no rainfall within 24h, check latest overall just in case, but mark missing if None
    rainfall_score, rain_missing, rain_desc = score_rainfall(latest_rainfall)
    if rain_missing:
        missing_data.append("rainfall")

    # 2. Latest drainage record
    latest_drainage = (
        DrainageRecord.query.filter_by(location_id=location_id)
        .order_by(DrainageRecord.updated_at.desc(), DrainageRecord.id.desc())
        .first()
    )
    drainage_score, drain_missing, drain_desc = score_drainage(latest_drainage)
    if drain_missing:
        missing_data.append("drainage")

    # 3. Historical frequency from location
    historical_score, hist_missing, hist_desc = score_historical(
        location.historical_waterlogging_frequency
    )
    if hist_missing:
        missing_data.append("historical_waterlogging_frequency")

    # 4. Elevation
    elevation_score, elev_desc = score_elevation(location.is_low_lying)

    # 5. Recent citizen reports in last 7 days
    cutoff_7d = datetime.utcnow() - timedelta(days=7)
    recent_reports_count = CitizenReport.query.filter(
        CitizenReport.location_id == location_id,
        CitizenReport.reported_at >= cutoff_7d,
    ).count()
    reports_score, rep_desc = score_reports(recent_reports_count)

    # 6. Weighted total risk score (0-100)
    risk_score = round(
        rainfall_score * WEIGHTS["rainfall"]
        + drainage_score * WEIGHTS["drainage"]
        + historical_score * WEIGHTS["historical"]
        + elevation_score * WEIGHTS["elevation"]
        + reports_score * WEIGHTS["reports"],
        1,
    )
    risk_score = max(0.0, min(100.0, risk_score))
    risk_category = get_risk_category(risk_score)

    # 7. Confidence = 1.0 - 0.2 per missing field (min 0.3)
    confidence = max(0.3, round(1.0 - 0.2 * len(missing_data), 2))

    # 8. Trend computation against previous assessment
    previous_assessment = (
        RiskAssessment.query.filter_by(location_id=location_id)
        .order_by(RiskAssessment.assessed_at.desc(), RiskAssessment.id.desc())
        .first()
    )
    if previous_assessment is not None:
        prev_score = previous_assessment.risk_score
        if risk_score > prev_score + 1.0:
            risk_trend = "increasing"
        elif risk_score < prev_score - 1.0:
            risk_trend = "decreasing"
        else:
            risk_trend = "stable"
    else:
        prev_score = None
        risk_trend = "stable"

    # 9. Explanation string
    explanation = (
        f"Waterlogging risk is {risk_category.upper()} at {location.name} due to: "
        f"{rain_desc} (contributing 35%), "
        f"{drain_desc} (contributing 25%), "
        f"{hist_desc} (contributing 20%), "
        f"{elev_desc} (contributing 10%), "
        f"{rep_desc} (contributing 10%). "
        f"Confidence: {int(confidence * 100)}%."
    )

    # 10. Warning trigger
    # Warning triggered if: risk_score >= 50 AND (risk_trend == 'increasing' OR warning_triggered by critical score)
    is_critical = risk_score >= 75.0
    warning_triggered = (risk_score >= 50.0) and (risk_trend == "increasing" or is_critical)
    if warning_triggered:
        warning_message = explanation
    else:
        warning_message = None

    # 11. Save and persist
    assessment = RiskAssessment(
        location_id=location_id,
        risk_score=risk_score,
        risk_category=risk_category,
        rainfall_score=rainfall_score,
        drainage_score=drainage_score,
        historical_score=historical_score,
        elevation_score=elevation_score,
        reports_score=reports_score,
        rainfall_weight=WEIGHTS["rainfall"],
        drainage_weight=WEIGHTS["drainage"],
        historical_weight=WEIGHTS["historical"],
        elevation_weight=WEIGHTS["elevation"],
        reports_weight=WEIGHTS["reports"],
        confidence=confidence,
        explanation=explanation,
        missing_data=json.dumps(missing_data),
        warning_triggered=warning_triggered,
        warning_message=warning_message,
        previous_risk_score=prev_score,
        risk_trend=risk_trend,
        assessed_at=datetime.utcnow(),
    )
    db.session.add(assessment)
    db.session.commit()

    return assessment.to_dict()

def calculate_all_risks():
    """Recalculate risk for all locations."""
    locations = Location.query.all()
    results = []
    for loc in locations:
        results.append(calculate_risk(loc.id))
    return results
