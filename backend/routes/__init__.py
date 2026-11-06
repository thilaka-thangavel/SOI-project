from .locations import locations_bp
from .rainfall import rainfall_bp
from .drainage import drainage_bp
from .reports import reports_bp
from .risk import risk_bp
from .inspections import inspections_bp
from .dashboard import dashboard_bp
from .analytics import analytics_bp
from .database import database_bp

def register_routes(app):
    """Register all API route blueprints with the /api prefix."""
    app.register_blueprint(locations_bp, url_prefix="/api")
    app.register_blueprint(rainfall_bp, url_prefix="/api")
    app.register_blueprint(drainage_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(risk_bp, url_prefix="/api")
    app.register_blueprint(inspections_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(database_bp, url_prefix="/api")
