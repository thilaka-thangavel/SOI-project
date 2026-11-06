from datetime import datetime
import json
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Location(db.Model):
    __tablename__ = "locations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    area = db.Column(db.String(100), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    is_low_lying = db.Column(db.Boolean, default=False, nullable=False)
    drainage_capacity = db.Column(db.String(50), nullable=True)  # high, medium, low
    historical_waterlogging_frequency = db.Column(db.String(50), nullable=True)  # rare, occasional, frequent, very_frequent
    monitoring_status = db.Column(db.String(50), default="active", nullable=False)
    location_type = db.Column(db.String(100), nullable=True)  # residential_street, road_intersection, near_stormwater_drain, commercial_street, underpass
    is_synthetic = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    rainfall_records = db.relationship("RainfallRecord", backref="location", lazy=True, cascade="all, delete-orphan")
    drainage_records = db.relationship("DrainageRecord", backref="location", lazy=True, cascade="all, delete-orphan")
    citizen_reports = db.relationship("CitizenReport", backref="location", lazy=True)
    historical_incidents = db.relationship("HistoricalIncident", backref="location", lazy=True, cascade="all, delete-orphan")
    risk_assessments = db.relationship("RiskAssessment", backref="location", lazy=True, cascade="all, delete-orphan")
    inspections = db.relationship("Inspection", backref="location", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "area": self.area,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_low_lying": self.is_low_lying,
            "drainage_capacity": self.drainage_capacity,
            "historical_waterlogging_frequency": self.historical_waterlogging_frequency,
            "monitoring_status": self.monitoring_status,
            "location_type": self.location_type,
            "is_synthetic": self.is_synthetic,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RainfallRecord(db.Model):
    __tablename__ = "rainfall_records"

    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    amount_mm = db.Column(db.Float, nullable=False)
    intensity = db.Column(db.String(50), nullable=True)  # low, moderate, heavy, very_heavy
    source_type = db.Column(db.String(100), default="synthetic", nullable=False)
    data_status = db.Column(db.String(50), default="verified", nullable=False)
    is_synthetic = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "location_id": self.location_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "amount_mm": self.amount_mm,
            "intensity": self.intensity,
            "source_type": self.source_type,
            "data_status": self.data_status,
            "is_synthetic": self.is_synthetic,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DrainageRecord(db.Model):
    __tablename__ = "drainage_records"

    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    drain_type = db.Column(db.String(100), nullable=True)  # stormwater, roadside, culvert, underground
    condition = db.Column(db.String(50), nullable=True)  # clear, partially_blocked, blocked, unknown
    blockage_status = db.Column(db.Boolean, default=False, nullable=False)
    last_inspection_date = db.Column(db.DateTime, nullable=True)
    maintenance_status = db.Column(db.String(50), default="good", nullable=True)  # good, needs_attention, critical
    supporting_report = db.Column(db.Text, nullable=True)
    updated_by = db.Column(db.String(100), nullable=True)
    is_synthetic = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "location_id": self.location_id,
            "drain_type": self.drain_type,
            "condition": self.condition,
            "blockage_status": self.blockage_status,
            "last_inspection_date": self.last_inspection_date.isoformat() if self.last_inspection_date else None,
            "maintenance_status": self.maintenance_status,
            "supporting_report": self.supporting_report,
            "updated_by": self.updated_by,
            "is_synthetic": self.is_synthetic,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class CitizenReport(db.Model):
    __tablename__ = "citizen_reports"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=True)
    location_text = db.Column(db.String(200), nullable=True)
    issue_type = db.Column(db.String(100), nullable=True)  # water_accumulation, drain_blockage, road_flooding, overflowing_drain, other
    water_depth = db.Column(db.String(50), nullable=True)  # no_standing_water, shallow, moderate, severe, unknown
    reported_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    photo_path = db.Column(db.String(500), nullable=True)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verified_by = db.Column(db.String(100), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default="pending", nullable=False)  # pending, under_review, resolved, dismissed
    is_synthetic = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "location_id": self.location_id,
            "location_text": self.location_text,
            "issue_type": self.issue_type,
            "water_depth": self.water_depth,
            "reported_at": self.reported_at.isoformat() if self.reported_at else None,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "photo_path": self.photo_path,
            "is_verified": self.is_verified,
            "verified_by": self.verified_by,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "status": self.status,
            "is_synthetic": self.is_synthetic,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class HistoricalIncident(db.Model):
    __tablename__ = "historical_incidents"

    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    incident_date = db.Column(db.DateTime, nullable=True)
    severity = db.Column(db.String(50), nullable=True)  # minor, moderate, severe
    description = db.Column(db.Text, nullable=True)
    duration_hours = db.Column(db.Float, nullable=True)
    affected_area_sqm = db.Column(db.Float, nullable=True)
    source = db.Column(db.String(200), nullable=True)
    is_synthetic = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "location_id": self.location_id,
            "incident_date": self.incident_date.isoformat() if self.incident_date else None,
            "severity": self.severity,
            "description": self.description,
            "duration_hours": self.duration_hours,
            "affected_area_sqm": self.affected_area_sqm,
            "source": self.source,
            "is_synthetic": self.is_synthetic,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class RiskAssessment(db.Model):
    __tablename__ = "risk_assessments"

    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    risk_score = db.Column(db.Float, nullable=False)  # 0-100
    risk_category = db.Column(db.String(50), nullable=False)  # low, moderate, high, critical
    rainfall_score = db.Column(db.Float, default=0.0, nullable=False)
    drainage_score = db.Column(db.Float, default=0.0, nullable=False)
    historical_score = db.Column(db.Float, default=0.0, nullable=False)
    elevation_score = db.Column(db.Float, default=0.0, nullable=False)
    reports_score = db.Column(db.Float, default=0.0, nullable=False)
    rainfall_weight = db.Column(db.Float, default=0.35, nullable=False)
    drainage_weight = db.Column(db.Float, default=0.25, nullable=False)
    historical_weight = db.Column(db.Float, default=0.20, nullable=False)
    elevation_weight = db.Column(db.Float, default=0.10, nullable=False)
    reports_weight = db.Column(db.Float, default=0.10, nullable=False)
    confidence = db.Column(db.Float, default=1.0, nullable=False)  # 0-1
    explanation = db.Column(db.Text, nullable=True)
    missing_data = db.Column(db.Text, nullable=True)  # JSON list
    warning_triggered = db.Column(db.Boolean, default=False, nullable=False)
    warning_message = db.Column(db.Text, nullable=True)
    previous_risk_score = db.Column(db.Float, nullable=True)
    risk_trend = db.Column(db.String(50), default="stable", nullable=True)  # increasing, decreasing, stable
    assessed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    inspections = db.relationship("Inspection", backref="risk_assessment", lazy=True)

    def to_dict(self):
        missing_list = []
        if self.missing_data:
            try:
                missing_list = json.loads(self.missing_data)
            except Exception:
                missing_list = [self.missing_data]

        return {
            "id": self.id,
            "location_id": self.location_id,
            "risk_score": self.risk_score,
            "risk_category": self.risk_category,
            "rainfall_score": self.rainfall_score,
            "drainage_score": self.drainage_score,
            "historical_score": self.historical_score,
            "elevation_score": self.elevation_score,
            "reports_score": self.reports_score,
            "rainfall_weight": self.rainfall_weight,
            "drainage_weight": self.drainage_weight,
            "historical_weight": self.historical_weight,
            "elevation_weight": self.elevation_weight,
            "reports_weight": self.reports_weight,
            "confidence": self.confidence,
            "explanation": self.explanation,
            "missing_data": missing_list,
            "warning_triggered": self.warning_triggered,
            "warning_message": self.warning_message,
            "previous_risk_score": self.previous_risk_score,
            "risk_trend": self.risk_trend,
            "assessed_at": self.assessed_at.isoformat() if self.assessed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Inspection(db.Model):
    __tablename__ = "inspections"

    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    risk_assessment_id = db.Column(db.Integer, db.ForeignKey("risk_assessments.id"), nullable=True)
    title = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), default="pending", nullable=False)  # pending, in_progress, completed, cancelled
    priority = db.Column(db.String(50), default="medium", nullable=False)  # low, medium, high, critical
    assigned_to = db.Column(db.String(100), nullable=True)
    scheduled_date = db.Column(db.DateTime, nullable=True)
    completed_date = db.Column(db.DateTime, nullable=True)
    findings = db.Column(db.Text, nullable=True)
    drain_condition_found = db.Column(db.String(50), nullable=True)
    flooding_confirmed = db.Column(db.Boolean, default=False, nullable=False)  # ONLY human can set this
    issue_verified = db.Column(db.Boolean, nullable=True)
    alert_incorrect = db.Column(db.Boolean, default=False, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "location_id": self.location_id,
            "risk_assessment_id": self.risk_assessment_id,
            "title": self.title,
            "status": self.status,
            "priority": self.priority,
            "assigned_to": self.assigned_to,
            "scheduled_date": self.scheduled_date.isoformat() if self.scheduled_date else None,
            "completed_date": self.completed_date.isoformat() if self.completed_date else None,
            "findings": self.findings,
            "drain_condition_found": self.drain_condition_found,
            "flooding_confirmed": self.flooding_confirmed,
            "issue_verified": self.issue_verified,
            "alert_incorrect": self.alert_incorrect,
            "notes": self.notes,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DataSource(db.Model):
    __tablename__ = "data_sources"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    source_type = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_format = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "source_type": self.source_type,
            "description": self.description,
            "is_active": self.is_active,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "data_format": self.data_format,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
