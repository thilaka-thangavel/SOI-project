from flask import Blueprint, jsonify
from models import db, DataSource
from seed_data import create_synthetic_data

database_bp = Blueprint("database", __name__)

@database_bp.route("/database/reset", methods=["POST"])
def reset_database():
    """Drop all tables, recreate schema, and re-seed with synthetic data."""
    try:
        db.drop_all()
        db.create_all()
        res = create_synthetic_data(force=True)
        return jsonify({
            "status": "success",
            "message": "Database reset and re-seeded with synthetic data successfully.",
            "details": res,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": f"Failed to reset database: {str(e)}",
        }), 500


@database_bp.route("/data-sources", methods=["GET"])
def get_data_sources():
    """Return all configured data sources."""
    sources = DataSource.query.all()
    return jsonify({
        "sources": [s.to_dict() for s in sources],
        "count": len(sources)
    }), 200
