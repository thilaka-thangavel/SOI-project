import os
from datetime import datetime
from flask import Flask, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import Config
from models import db
from routes import register_routes
from seed_data import create_synthetic_data

# Resolve the static folder (React build output)
STATIC_FOLDER = os.path.join(os.path.dirname(__file__), "static")

def create_app(config_class=Config):
    app = Flask(
        __name__,
        static_folder=STATIC_FOLDER,
        static_url_path="",
    )
    app.config.from_object(config_class)

    # Enable CORS for API routes only
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", ["*"])}},
        supports_credentials=True,
    )

    # Initialize SQLAlchemy
    db.init_app(app)

    # Register API blueprints
    register_routes(app)

    # ─── Health Check ─────────────────────────────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "service": "DrainWatch AI Backend",
        }), 200

    # ─── Serve React App ──────────────────────────────────────────────────────
    # Serve static assets (JS, CSS, images) from the React build
    @app.route("/assets/<path:filename>")
    def serve_assets(filename):
        return send_from_directory(os.path.join(STATIC_FOLDER, "assets"), filename)

    # Catch-all: for any route that is NOT /api/*, serve the React index.html
    # This enables React Router to handle client-side navigation
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        # If the request is for an actual file that exists in static/, serve it
        full_path = os.path.join(STATIC_FOLDER, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(STATIC_FOLDER, path)
        # Otherwise return index.html for React Router to handle
        index_path = os.path.join(STATIC_FOLDER, "index.html")
        if os.path.isfile(index_path):
            return send_file(index_path)
        # If frontend hasn't been built yet, show a helpful message
        return jsonify({
            "error": "Frontend not built",
            "message": (
                "The React frontend has not been built yet. "
                "Run: cd frontend && npm run build"
            ),
            "api_status": "Backend is running correctly.",
            "api_docs": "Visit /api/health to confirm the API is working.",
        }), 200

    # ─── DB Initialization ────────────────────────────────────────────────────
    _app_initialized = False

    @app.before_request
    def ensure_db_initialized():
        nonlocal _app_initialized
        if not _app_initialized:
            try:
                db.create_all()
                create_synthetic_data()
            except Exception as ex:
                app.logger.warning(f"Initial setup check: {ex}")
            _app_initialized = True

    # ─── Error Handlers ───────────────────────────────────────────────────────
    @app.errorhandler(400)
    def handle_bad_request(e):
        db.session.rollback()
        return jsonify({"error": "Bad Request", "message": str(e)}), 400

    @app.errorhandler(404)
    def handle_not_found(e):
        db.session.rollback()
        # For non-API 404s, try to serve React app
        index_path = os.path.join(STATIC_FOLDER, "index.html")
        if os.path.isfile(index_path):
            return send_file(index_path)
        return jsonify({"error": "Not Found", "message": str(e)}), 404

    @app.errorhandler(500)
    def handle_internal_server_error(e):
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

    @app.errorhandler(Exception)
    def handle_generic_exception(e):
        db.session.rollback()
        if isinstance(e, HTTPException):
            return jsonify({"error": e.name, "message": e.description}), e.code
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

    return app


app = create_app()


def init_db():
    with app.app_context():
        db.create_all()
        create_synthetic_data()


# Initialize tables and seed data on module load
try:
    with app.app_context():
        db.create_all()
        create_synthetic_data()
except Exception as e:
    pass

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
