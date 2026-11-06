from datetime import datetime, timedelta
import random
from models import (
    db,
    Location,
    RainfallRecord,
    DrainageRecord,
    CitizenReport,
    HistoricalIncident,
    RiskAssessment,
    Inspection,
    DataSource,
)
from risk_engine import calculate_risk

def create_synthetic_data(force=False):
    """Seed synthetic data if database is empty or force=True."""
    if not force and Location.query.first() is not None:
        return {"status": "skipped", "message": "Database already contains data"}

    # Clear existing if force
    if force:
        db.session.query(Inspection).delete()
        db.session.query(RiskAssessment).delete()
        db.session.query(CitizenReport).delete()
        db.session.query(HistoricalIncident).delete()
        db.session.query(DrainageRecord).delete()
        db.session.query(RainfallRecord).delete()
        db.session.query(DataSource).delete()
        db.session.query(Location).delete()
        db.session.commit()

    now = datetime.utcnow()

    # 1. Locations
    locations_spec = [
        {
            "id": 1,
            "name": "Syn. Central Road",
            "area": "Downtown",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "is_low_lying": True,
            "drainage_capacity": "low",
            "historical_waterlogging_frequency": "very_frequent",
            "location_type": "road_intersection",
            "monitoring_status": "active",
        },
        {
            "id": 2,
            "name": "Syn. Gandhi Nagar Underpass",
            "area": "West Zone",
            "latitude": 12.9611,
            "longitude": 77.5550,
            "is_low_lying": True,
            "drainage_capacity": "low",
            "historical_waterlogging_frequency": "frequent",
            "location_type": "underpass",
            "monitoring_status": "active",
        },
        {
            "id": 3,
            "name": "Syn. MG Road Drain",
            "area": "Central",
            "latitude": 12.9758,
            "longitude": 77.6011,
            "is_low_lying": False,
            "drainage_capacity": "medium",
            "historical_waterlogging_frequency": "occasional",
            "location_type": "near_stormwater_drain",
            "monitoring_status": "active",
        },
        {
            "id": 4,
            "name": "Syn. Lal Bagh Residential",
            "area": "South",
            "latitude": 12.9507,
            "longitude": 77.5848,
            "is_low_lying": True,
            "drainage_capacity": "medium",
            "historical_waterlogging_frequency": "frequent",
            "location_type": "residential_street",
            "monitoring_status": "active",
        },
        {
            "id": 5,
            "name": "Syn. Koramangala Market",
            "area": "South East",
            "latitude": 12.9351,
            "longitude": 77.6195,
            "is_low_lying": False,
            "drainage_capacity": "high",
            "historical_waterlogging_frequency": "rare",
            "location_type": "commercial_street",
            "monitoring_status": "active",
        },
        {
            "id": 6,
            "name": "Syn. Hebbal Junction",
            "area": "North",
            "latitude": 13.0358,
            "longitude": 77.5971,
            "is_low_lying": True,
            "drainage_capacity": "low",
            "historical_waterlogging_frequency": "frequent",
            "location_type": "road_intersection",
            "monitoring_status": "active",
        },
        {
            "id": 7,
            "name": "Syn. Electronic City Road",
            "area": "South",
            "latitude": 12.8399,
            "longitude": 77.6770,
            "is_low_lying": False,
            "drainage_capacity": "medium",
            "historical_waterlogging_frequency": "occasional",
            "location_type": "commercial_street",
            "monitoring_status": "active",
        },
        {
            "id": 8,
            "name": "Syn. Whitefield Drain",
            "area": "East",
            "latitude": 12.9698,
            "longitude": 77.7499,
            "is_low_lying": False,
            "drainage_capacity": "high",
            "historical_waterlogging_frequency": "rare",
            "location_type": "near_stormwater_drain",
            "monitoring_status": "active",
        },
        {
            "id": 9,
            "name": "Syn. Rajajinagar Colony",
            "area": "West Zone",
            "latitude": 12.9917,
            "longitude": 77.5520,
            "is_low_lying": True,
            "drainage_capacity": "low",
            "historical_waterlogging_frequency": "very_frequent",
            "location_type": "residential_street",
            "monitoring_status": "active",
        },
        {
            "id": 10,
            "name": "Syn. Incomplete Data Zone",
            "area": "North East",
            "latitude": 13.0100,
            "longitude": 77.6400,
            "is_low_lying": False,
            "drainage_capacity": "medium",
            "historical_waterlogging_frequency": "occasional",
            "location_type": "road_intersection",
            "monitoring_status": "active",
        },
    ]

    location_objs = {}
    for spec in locations_spec:
        loc = Location(
            id=spec["id"],
            name=spec["name"],
            area=spec["area"],
            latitude=spec["latitude"],
            longitude=spec["longitude"],
            is_low_lying=spec["is_low_lying"],
            drainage_capacity=spec["drainage_capacity"],
            historical_waterlogging_frequency=spec["historical_waterlogging_frequency"],
            location_type=spec["location_type"],
            monitoring_status=spec["monitoring_status"],
            is_synthetic=True,
            created_at=now - timedelta(days=30),
        )
        db.session.add(loc)
        location_objs[spec["id"]] = loc
    db.session.commit()

    # 2. Data Sources
    data_sources = [
        DataSource(
            name="Synthetic Rainfall Generator",
            source_type="automated_sensor_feed",
            description="High-frequency simulated precipitation monitoring telemetry.",
            is_active=True,
            data_format="JSON",
            notes="Generates hourly weather radar estimations and rain-gauge records.",
        ),
        DataSource(
            name="Municipal Drain Database (synthetic)",
            source_type="municipal_asset_system",
            description="Drain network condition and blockage telemetry.",
            is_active=True,
            data_format="SQL",
            notes="Tracks physical stormwater line inspections and scheduled cleaning.",
        ),
        DataSource(
            name="Citizen Report Portal",
            source_type="crowdsourced_app",
            description="Geotagged citizen reports of urban waterlogging and drain overflows.",
            is_active=True,
            data_format="REST_API",
            notes="Ingests citizen submissions with water depth and photographic evidence.",
        ),
        DataSource(
            name="Historical Incident Archive (synthetic)",
            source_type="historical_records",
            description="Past urban flooding events, duration, and damage assessments.",
            is_active=True,
            data_format="CSV_IMPORT",
            notes="Maintains 5-year longitudinal historical waterlogging history.",
        ),
    ]
    for ds in data_sources:
        db.session.add(ds)
    db.session.commit()

    # 3. Rainfall Records
    # Latest rainfall specification:
    # Loc 1: 55mm (very_heavy)
    # Loc 2: 35mm (heavy)
    # Loc 3: 30mm (heavy)
    # Loc 4: 18mm (moderate)
    # Loc 5: 5mm (low)
    # Loc 6: 28mm (heavy)
    # Loc 7: 15mm (moderate)
    # Loc 8: 8mm (low)
    # Loc 9: 60mm (very_heavy)
    # Loc 10: NO rainfall record
    latest_rain_map = {
        1: (55.0, "very_heavy"),
        2: (35.0, "heavy"),
        3: (30.0, "heavy"),
        4: (18.0, "moderate"),
        5: (5.0, "low"),
        6: (28.0, "heavy"),
        7: (15.0, "moderate"),
        8: (8.0, "low"),
        9: (60.0, "very_heavy"),
    }

    def get_intensity(amt):
        if amt <= 10.0:
            return "low"
        elif amt <= 25.0:
            return "moderate"
        elif amt <= 50.0:
            return "heavy"
        return "very_heavy"

    # Insert historical time series (over past 7 days) and latest for each loc 1-9
    for loc_id, (latest_amt, latest_intensity) in latest_rain_map.items():
        # Latest record (1 hour ago)
        rec = RainfallRecord(
            location_id=loc_id,
            timestamp=now - timedelta(hours=1),
            amount_mm=latest_amt,
            intensity=latest_intensity,
            source_type="synthetic",
            data_status="verified",
            is_synthetic=True,
            created_at=now - timedelta(hours=1),
        )
        db.session.add(rec)

        # 5-6 prior points across past 7 days
        for day in range(1, 7):
            prior_time = now - timedelta(days=day, hours=random.randint(2, 6))
            # Vary historical rain realistically
            if loc_id in [1, 2, 9]:
                prior_amt = round(random.uniform(15.0, 48.0), 1)
            elif loc_id in [3, 4, 6, 7]:
                prior_amt = round(random.uniform(8.0, 32.0), 1)
            else:
                prior_amt = round(random.uniform(2.0, 14.0), 1)

            hist_rec = RainfallRecord(
                location_id=loc_id,
                timestamp=prior_time,
                amount_mm=prior_amt,
                intensity=get_intensity(prior_amt),
                source_type="synthetic",
                data_status="verified",
                is_synthetic=True,
                created_at=prior_time,
            )
            db.session.add(hist_rec)
    db.session.commit()

    # 4. Drainage Records
    drainage_spec = [
        {
            "location_id": 1,
            "drain_type": "stormwater",
            "condition": "blocked",
            "blockage_status": True,
            "last_inspection_date": now - timedelta(days=5),
            "maintenance_status": "critical",
            "supporting_report": "Heavy plastic waste and silt accumulation clogging arterial intake.",
            "updated_by": "Eng. R. Sharma",
        },
        {
            "location_id": 2,
            "drain_type": "roadside",
            "condition": "partially_blocked",
            "blockage_status": True,
            "last_inspection_date": now - timedelta(days=3),
            "maintenance_status": "needs_attention",
            "supporting_report": "Debris deposited in underpass drainage sump, pump flow restricted by 40%.",
            "updated_by": "Officer V. Kumar",
        },
        {
            "location_id": 3,
            "drain_type": "stormwater",
            "condition": "clear",
            "blockage_status": False,
            "last_inspection_date": now - timedelta(days=2),
            "maintenance_status": "good",
            "supporting_report": "Stormwater channel cleared during pre-monsoon desilting drive.",
            "updated_by": "Inspector P. Nair",
        },
        {
            "location_id": 4,
            "drain_type": "culvert",
            "condition": "partially_blocked",
            "blockage_status": True,
            "last_inspection_date": now - timedelta(days=4),
            "maintenance_status": "needs_attention",
            "supporting_report": "Culvert mouth partially blocked by tree trimmings and mud.",
            "updated_by": "Eng. M. Patel",
        },
        {
            "location_id": 5,
            "drain_type": "underground",
            "condition": "clear",
            "blockage_status": False,
            "last_inspection_date": now - timedelta(days=1),
            "maintenance_status": "good",
            "supporting_report": "Underground trunk line flushed and inspected via CCTV robot.",
            "updated_by": "Officer A. Iyer",
        },
        {
            "location_id": 6,
            "drain_type": "roadside",
            "condition": "blocked",
            "blockage_status": True,
            "last_inspection_date": now - timedelta(days=6),
            "maintenance_status": "critical",
            "supporting_report": "Construction debris dumping detected directly above roadside grating.",
            "updated_by": "Eng. K. Rao",
        },
        {
            "location_id": 7,
            "drain_type": "stormwater",
            "condition": "clear",
            "blockage_status": False,
            "last_inspection_date": now - timedelta(days=2),
            "maintenance_status": "good",
            "supporting_report": "Industrial corridor main drain running freely.",
            "updated_by": "Inspector T. Deshmukh",
        },
        {
            "location_id": 8,
            "drain_type": "culvert",
            "condition": "clear",
            "blockage_status": False,
            "last_inspection_date": now - timedelta(days=1),
            "maintenance_status": "good",
            "supporting_report": "Regular culvert maintenance verified clean.",
            "updated_by": "Officer S. Sengupta",
        },
        {
            "location_id": 9,
            "drain_type": "roadside",
            "condition": "blocked",
            "blockage_status": True,
            "last_inspection_date": now - timedelta(days=7),
            "maintenance_status": "critical",
            "supporting_report": "Severe sediment blockage and structural collapse of side masonry wall.",
            "updated_by": "Eng. R. Sharma",
        },
        {
            "location_id": 10,
            "drain_type": "stormwater",
            "condition": "unknown",
            "blockage_status": False,
            "last_inspection_date": None,
            "maintenance_status": "needs_attention",
            "supporting_report": "Pending initial survey and camera inspection.",
            "updated_by": "System Pending",
        },
    ]
    for d in drainage_spec:
        rec = DrainageRecord(
            location_id=d["location_id"],
            drain_type=d["drain_type"],
            condition=d["condition"],
            blockage_status=d["blockage_status"],
            last_inspection_date=d["last_inspection_date"],
            maintenance_status=d["maintenance_status"],
            supporting_report=d["supporting_report"],
            updated_by=d["updated_by"],
            is_synthetic=True,
            created_at=now - timedelta(days=7),
            updated_at=d["last_inspection_date"] or (now - timedelta(days=7)),
        )
        db.session.add(rec)
    db.session.commit()

    # 5. Historical Incidents (3+ each for locations 1, 2, 4, 6, 9; 1-2 for others)
    incidents_spec = [
        # Location 1
        (1, now - timedelta(days=45), "severe", "Severe flooding across junction, vehicle traffic halted for 4 hours.", 4.5, 3200.0, "Traffic Police Log"),
        (1, now - timedelta(days=120), "severe", "Monsoon cloudburst flooded commercial basements and shops.", 6.0, 4500.0, "Municipal Disaster Cell"),
        (1, now - timedelta(days=210), "moderate", "Knee-deep water accumulation after unexpected torrential shower.", 3.0, 1800.0, "Ward 22 Incident Report"),

        # Location 2
        (2, now - timedelta(days=30), "severe", "Underpass submerged up to 1.5 meters, bus stranded.", 5.5, 1200.0, "Fire & Emergency Services"),
        (2, now - timedelta(days=95), "severe", "Pump failure caused rapid inundation of underpass approach.", 4.0, 1100.0, "PWD Inspection Report"),
        (2, now - timedelta(days=180), "moderate", "Subway traffic diverted due to 0.6m standing water.", 3.2, 900.0, "Traffic Management Center"),

        # Location 3
        (3, now - timedelta(days=75), "minor", "Slight water spillover during peak rush hour rain.", 1.5, 450.0, "Ward 45 Log"),
        (3, now - timedelta(days=160), "moderate", "Stormwater channel overflow onto pedestrian sidewalk.", 2.5, 800.0, "Ward 45 Log"),

        # Location 4
        (4, now - timedelta(days=40), "moderate", "Residential street waterlogged, water reached home gates.", 4.0, 2200.0, "RWA Complaint #882"),
        (4, now - timedelta(days=110), "severe", "Compound wall collapse due to prolonged stagnant water pressure.", 7.0, 3100.0, "Disaster Management Cell"),
        (4, now - timedelta(days=230), "moderate", "Storm drain backflow inundated residential lane.", 3.5, 1900.0, "Ward 63 Log"),

        # Location 5
        (5, now - timedelta(days=130), "minor", "Temporary ponding near marketplace entrance.", 1.0, 300.0, "Market Association"),

        # Location 6
        (6, now - timedelta(days=20), "severe", "Highway flyover junction flooded causing 8km gridlock.", 6.0, 5000.0, "Highways Authority Report"),
        (6, now - timedelta(days=85), "moderate", "Slip road submerged under 0.5m water.", 3.8, 2600.0, "Traffic Police Dispatch"),
        (6, now - timedelta(days=175), "severe", "Drain overflowed onto national highway service lane.", 5.0, 3800.0, "PWD Emergency Log"),

        # Location 7
        (7, now - timedelta(days=60), "minor", "Roadside ditch overflow caused minor lane restriction.", 1.8, 500.0, "Tech Park Security Desk"),
        (7, now - timedelta(days=140), "moderate", "Heavy rainfall overwhelmed curbside drainage channel.", 2.5, 1200.0, "Industrial Zone Log"),

        # Location 8
        (8, now - timedelta(days=90), "minor", "Brief water accumulation near IT corridor culvert.", 1.2, 400.0, "Ward 12 Incident Sheet"),

        # Location 9
        (9, now - timedelta(days=25), "severe", "Colony roads inundated; boats deployed to rescue elderly residents.", 8.0, 6000.0, "State Disaster Management"),
        (9, now - timedelta(days=70), "severe", "Extensive waterlogging lasting overnight after storm drain breached.", 9.5, 5400.0, "Zonal Office Flash Report"),
        (9, now - timedelta(days=150), "severe", "Basement parking flood damaged 25 vehicles.", 5.0, 4200.0, "Residents Welfare Association"),

        # Location 10
        (10, now - timedelta(days=100), "moderate", "Unsurveyed intersection ponding reported by commuters.", 2.2, 950.0, "Social Media Monitoring"),
    ]

    for loc_id, dt, sev, desc, dur, area_sqm, src in incidents_spec:
        inc = HistoricalIncident(
            location_id=loc_id,
            incident_date=dt,
            severity=sev,
            description=desc,
            duration_hours=dur,
            affected_area_sqm=area_sqm,
            source=src,
            is_synthetic=True,
            created_at=dt,
        )
        db.session.add(inc)
    db.session.commit()

    # 6. Citizen Reports (at least 20 total)
    # Required breakdown:
    # Location 1: 3 reports — water_accumulation, severe, verified
    # Location 2: 2 reports — road_flooding, moderate
    # Location 4: 2 reports — water_accumulation, moderate
    # Location 6: 1 report — drain_blockage, shallow
    # Location 9: 4 reports — water_accumulation, severe — Scenario E (multiple reports)
    # Other locations: 1-2 reports each
    reports_spec = [
        # Location 1 (3 reports, severe, verified)
        {
            "loc": 1,
            "title": "Severe intersection flooding near Central signal",
            "desc": "Water is currently above bumper level on Central Road. Vehicles turning back.",
            "issue": "water_accumulation",
            "depth": "severe",
            "time": now - timedelta(hours=3),
            "lat": 12.9718,
            "lon": 77.5948,
            "verified": True,
            "by": "Inspector P. Nair",
            "status": "under_review",
        },
        {
            "loc": 1,
            "title": "Central road stormwater drain overflow",
            "desc": "Drain manhole cover blown open with gushing murky water.",
            "issue": "overflowing_drain",
            "depth": "severe",
            "time": now - timedelta(hours=8),
            "lat": 12.9715,
            "lon": 77.5944,
            "verified": True,
            "by": "Officer V. Kumar",
            "status": "under_review",
        },
        {
            "loc": 1,
            "title": "Traffic completely stuck in standing water",
            "desc": "Cars stalling in 2-foot water near metro pillar 104.",
            "issue": "water_accumulation",
            "depth": "severe",
            "time": now - timedelta(days=1, hours=2),
            "lat": 12.9720,
            "lon": 77.5950,
            "verified": True,
            "by": "Eng. R. Sharma",
            "status": "pending",
        },

        # Location 2 (2 reports, road_flooding, moderate)
        {
            "loc": 2,
            "title": "Gandhi Nagar Underpass water level rising",
            "desc": "Standing water reaching halfway up passenger car wheels.",
            "issue": "road_flooding",
            "depth": "moderate",
            "time": now - timedelta(hours=4),
            "lat": 12.9612,
            "lon": 77.5552,
            "verified": True,
            "by": "Officer V. Kumar",
            "status": "under_review",
        },
        {
            "loc": 2,
            "title": "Underpass entrance blocked by flash ponding",
            "desc": "Water accumulating fast at the dip of the subway approach.",
            "issue": "road_flooding",
            "depth": "moderate",
            "time": now - timedelta(hours=14),
            "lat": 12.9610,
            "lon": 77.5548,
            "verified": False,
            "by": None,
            "status": "pending",
        },

        # Location 4 (2 reports, water_accumulation, moderate)
        {
            "loc": 4,
            "title": "Lal Bagh 4th Cross inundated",
            "desc": "Water logged in front of residences, residents unable to walk out.",
            "issue": "water_accumulation",
            "depth": "moderate",
            "time": now - timedelta(hours=5),
            "lat": 12.9509,
            "lon": 77.5850,
            "verified": True,
            "by": "Eng. M. Patel",
            "status": "pending",
        },
        {
            "loc": 4,
            "title": "Stagnant stormwater on street corner",
            "desc": "Storm drain grating choked with leaves, pooling on road curve.",
            "issue": "water_accumulation",
            "depth": "moderate",
            "time": now - timedelta(days=2),
            "lat": 12.9505,
            "lon": 77.5846,
            "verified": False,
            "by": None,
            "status": "pending",
        },

        # Location 6 (1 report, drain_blockage, shallow)
        {
            "loc": 6,
            "title": "Construction rubble clogging flyover feeder drain",
            "desc": "Sandbags and concrete debris blocking the roadside gulley trap.",
            "issue": "drain_blockage",
            "depth": "shallow",
            "time": now - timedelta(hours=10),
            "lat": 13.0360,
            "lon": 77.5973,
            "verified": True,
            "by": "Eng. K. Rao",
            "status": "under_review",
        },

        # Location 9 (4 reports, water_accumulation, severe)
        {
            "loc": 9,
            "title": "Rajajinagar main sector submerged",
            "desc": "Water entering ground floor apartments, knee high on main avenue.",
            "issue": "water_accumulation",
            "depth": "severe",
            "time": now - timedelta(hours=2),
            "lat": 12.9919,
            "lon": 77.5522,
            "verified": True,
            "by": "Eng. R. Sharma",
            "status": "pending",
        },
        {
            "loc": 9,
            "title": "Severe backflow from colony culvert",
            "desc": "Dark floodwater bursting out of storm drain covers.",
            "issue": "overflowing_drain",
            "depth": "severe",
            "time": now - timedelta(hours=6),
            "lat": 12.9915,
            "lon": 77.5518,
            "verified": True,
            "by": "Eng. R. Sharma",
            "status": "under_review",
        },
        {
            "loc": 9,
            "title": "Motorbikes submerged near colony entrance",
            "desc": "Multiple parked two-wheelers knocked down by gushing current.",
            "issue": "water_accumulation",
            "depth": "severe",
            "time": now - timedelta(hours=9),
            "lat": 12.9921,
            "lon": 77.5525,
            "verified": False,
            "by": None,
            "status": "pending",
        },
        {
            "loc": 9,
            "title": "Blocked drainage canal causing widespread inundation",
            "desc": "Main drainage outlet completely obstructed by fallen branch and plastic.",
            "issue": "drain_blockage",
            "depth": "severe",
            "time": now - timedelta(days=1),
            "lat": 12.9912,
            "lon": 77.5515,
            "verified": True,
            "by": "Officer V. Kumar",
            "status": "under_review",
        },

        # Other locations (Locations 3, 5, 7, 8, 10)
        {
            "loc": 3,
            "title": "Minor puddling along MG Road footpath",
            "desc": "Curbside grating is taking in water slowly during downpour.",
            "issue": "water_accumulation",
            "depth": "shallow",
            "time": now - timedelta(days=2),
            "lat": 12.9759,
            "lon": 77.6012,
            "verified": False,
            "by": None,
            "status": "resolved",
        },
        {
            "loc": 3,
            "title": "Leaves on drain inlet",
            "desc": "Sweepers swept tree debris right over the stormwater inlet grate.",
            "issue": "drain_blockage",
            "depth": "no_standing_water",
            "time": now - timedelta(days=3),
            "lat": 12.9757,
            "lon": 77.6010,
            "verified": True,
            "by": "Inspector P. Nair",
            "status": "resolved",
        },
        {
            "loc": 5,
            "title": "Puddle outside Koramangala market gate 2",
            "desc": "Slight pool formed after morning rain, clears out within 20 mins.",
            "issue": "water_accumulation",
            "depth": "shallow",
            "time": now - timedelta(days=4),
            "lat": 12.9352,
            "lon": 77.6197,
            "verified": False,
            "by": None,
            "status": "resolved",
        },
        {
            "loc": 7,
            "title": "Water accumulation on shoulder of highway",
            "desc": "Two lanes affected near Electronic City exit ramp.",
            "issue": "road_flooding",
            "depth": "moderate",
            "time": now - timedelta(days=3),
            "lat": 12.8401,
            "lon": 77.6772,
            "verified": True,
            "by": "Inspector T. Deshmukh",
            "status": "resolved",
        },
        {
            "loc": 7,
            "title": "Silt accumulation near bus shelter drain",
            "desc": "Runoff carrying red mud into drain opening.",
            "issue": "drain_blockage",
            "depth": "shallow",
            "time": now - timedelta(days=5),
            "lat": 12.8398,
            "lon": 77.6768,
            "verified": False,
            "by": None,
            "status": "dismissed",
        },
        {
            "loc": 8,
            "title": "Minor standing water near culvert walkway",
            "desc": "Pedestrians stepping around water accumulation on pavement.",
            "issue": "water_accumulation",
            "depth": "shallow",
            "time": now - timedelta(days=4),
            "lat": 12.9699,
            "lon": 77.7501,
            "verified": False,
            "by": None,
            "status": "resolved",
        },
        {
            "loc": 10,
            "title": "Citizen observation: drain inspection needed",
            "desc": "Intersection seems to collect runoff from adjacent flyover slope.",
            "issue": "other",
            "depth": "unknown",
            "time": now - timedelta(days=2),
            "lat": 13.0102,
            "lon": 77.6402,
            "verified": False,
            "by": None,
            "status": "pending",
        },
        {
            "loc": 10,
            "title": "Mud accumulation on roadside ditch",
            "desc": "Unpaved boundary washing sediment into unmonitored storm drain.",
            "issue": "drain_blockage",
            "depth": "shallow",
            "time": now - timedelta(days=5),
            "lat": 13.0098,
            "lon": 77.6398,
            "verified": False,
            "by": None,
            "status": "pending",
        },
    ]

    for item in reports_spec:
        rep = CitizenReport(
            title=item["title"],
            description=item["desc"],
            location_id=item["loc"],
            location_text=location_objs[item["loc"]].name,
            issue_type=item["issue"],
            water_depth=item["depth"],
            reported_at=item["time"],
            latitude=item["lat"],
            longitude=item["lon"],
            photo_path=None,
            is_verified=item["verified"],
            verified_by=item["by"],
            verified_at=(item["time"] + timedelta(hours=1)) if item["verified"] else None,
            status=item["status"],
            is_synthetic=True,
            created_at=item["time"],
        )
        db.session.add(rep)
    db.session.commit()

    # 7. Inspection Records (at least 8, high-risk locations, mix of statuses)
    inspections_spec = [
        {
            "loc": 1,
            "title": "Emergency Desilting & Sump Inspection - Central Road",
            "status": "in_progress",
            "priority": "critical",
            "assigned_to": "Eng. R. Sharma",
            "scheduled": now - timedelta(hours=6),
            "completed": None,
            "findings": "Major trash barrier discovered 15m downstream in concrete box drain. Suction excavator deployed.",
            "condition": "blocked",
            "flooding": True,
            "verified": True,
            "alert_incorrect": False,
            "notes": "Emergency pump unit active on site.",
            "created_by": "System Alert Trigger",
        },
        {
            "loc": 2,
            "title": "Gandhi Nagar Underpass Pump & Catchpit Verification",
            "status": "pending",
            "priority": "high",
            "assigned_to": "Officer V. Kumar",
            "scheduled": now + timedelta(hours=4),
            "completed": None,
            "findings": None,
            "condition": "partially_blocked",
            "flooding": False,
            "verified": None,
            "alert_incorrect": False,
            "notes": "Verify standby submersible pump generator and clear intake grate.",
            "created_by": "Zonal Dispatcher",
        },
        {
            "loc": 9,
            "title": "Rajajinagar Sector Main Conduit Rapid Assessment",
            "status": "in_progress",
            "priority": "critical",
            "assigned_to": "Eng. R. Sharma",
            "scheduled": now - timedelta(hours=3),
            "completed": None,
            "findings": "Severe silt and collapsed masonry slab restricting outlet to under 25% throughput.",
            "condition": "blocked",
            "flooding": True,
            "verified": True,
            "alert_incorrect": False,
            "notes": "Excavation and shoring contractor notified.",
            "created_by": "Municipal Chief Engineer",
        },
        {
            "loc": 6,
            "title": "Hebbal Junction Roadside Gulley Clearance",
            "status": "pending",
            "priority": "high",
            "assigned_to": "Eng. K. Rao",
            "scheduled": now + timedelta(hours=8),
            "completed": None,
            "findings": None,
            "condition": "blocked",
            "flooding": False,
            "verified": None,
            "alert_incorrect": False,
            "notes": "Issue notice to metro construction vendor regarding illegal debris pile.",
            "created_by": "Highway Liaison",
        },
        {
            "loc": 4,
            "title": "Lal Bagh Residential Culvert Desilting Check",
            "status": "completed",
            "priority": "medium",
            "assigned_to": "Eng. M. Patel",
            "scheduled": now - timedelta(days=2),
            "completed": now - timedelta(days=1),
            "findings": "Cleared 2.5 tonnes of compost and branch debris from culvert mouth.",
            "condition": "partially_blocked",
            "flooding": False,
            "verified": True,
            "alert_incorrect": False,
            "notes": "Flow restored to 75% capacity.",
            "created_by": "Ward Engineer",
        },
        {
            "loc": 3,
            "title": "MG Road Main Drain Routine Post-Rain Verification",
            "status": "completed",
            "priority": "low",
            "assigned_to": "Inspector P. Nair",
            "scheduled": now - timedelta(days=3),
            "completed": now - timedelta(days=2),
            "findings": "Free flow maintained throughout arterial stormwater conduit.",
            "condition": "clear",
            "flooding": False,
            "verified": True,
            "alert_incorrect": False,
            "notes": "No action required.",
            "created_by": "Routine Schedule",
        },
        {
            "loc": 7,
            "title": "Electronic City Tech Zone Culvert Condition Survey",
            "status": "completed",
            "priority": "low",
            "assigned_to": "Inspector T. Deshmukh",
            "scheduled": now - timedelta(days=4),
            "completed": now - timedelta(days=3),
            "findings": "Storm drain channels free flowing. Minor sediment at mouth cleared.",
            "condition": "clear",
            "flooding": False,
            "verified": True,
            "alert_incorrect": False,
            "notes": "Verified good maintenance.",
            "created_by": "Tech Park Board",
        },
        {
            "loc": 10,
            "title": "Baseline Survey - Incomplete Data Zone Ground Truthing",
            "status": "pending",
            "priority": "medium",
            "assigned_to": "Officer A. Iyer",
            "scheduled": now + timedelta(days=1),
            "completed": None,
            "findings": None,
            "condition": "unknown",
            "flooding": False,
            "verified": None,
            "alert_incorrect": False,
            "notes": "Audit missing sensor instrumentation and physical culvert invert levels.",
            "created_by": "Data Quality Auditor",
        },
    ]

    for item in inspections_spec:
        insp = Inspection(
            location_id=item["loc"],
            risk_assessment_id=None,
            title=item["title"],
            status=item["status"],
            priority=item["priority"],
            assigned_to=item["assigned_to"],
            scheduled_date=item["scheduled"],
            completed_date=item["completed"],
            findings=item["findings"],
            drain_condition_found=item["condition"],
            flooding_confirmed=item["flooding"],
            issue_verified=item["verified"],
            alert_incorrect=item["alert_incorrect"],
            notes=item["notes"],
            created_by=item["created_by"],
            created_at=item["scheduled"] - timedelta(hours=12),
            updated_at=item["completed"] or item["scheduled"],
        )
        db.session.add(insp)
    db.session.commit()

    # 8. Compute initial baseline assessments (from 12h ago) to establish trends
    # For high risk locations, seed a slightly lower previous score so trend shows 'increasing'
    for loc_id in range(1, 11):
        prev_time = now - timedelta(hours=12)
        base_score = 45.0 if loc_id in [1, 2, 6, 9] else 20.0
        prev_assessment = RiskAssessment(
            location_id=loc_id,
            risk_score=base_score,
            risk_category="moderate" if base_score >= 25 else "low",
            rainfall_score=base_score,
            drainage_score=base_score,
            historical_score=base_score,
            elevation_score=50.0,
            reports_score=0.0,
            rainfall_weight=0.35,
            drainage_weight=0.25,
            historical_weight=0.20,
            elevation_weight=0.10,
            reports_weight=0.10,
            confidence=0.8,
            explanation="Initial baseline assessment before peak storm system.",
            missing_data="[]",
            warning_triggered=False,
            warning_message=None,
            previous_risk_score=None,
            risk_trend="stable",
            assessed_at=prev_time,
            created_at=prev_time,
        )
        db.session.add(prev_assessment)
    db.session.commit()

    # 9. Calculate latest risk for all locations using the live risk engine!
    for loc_id in range(1, 11):
        calculate_risk(loc_id)

    return {"status": "success", "message": "Synthetic data created and risk calculated for 10 locations"}
