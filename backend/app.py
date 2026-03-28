import os
from flask import Flask
from backend.config import Config
from backend.extensions import cors, db, jwt, migrate


def create_app(config_object=None):
    app = Flask(__name__)

    # Default config
    app.config.from_object(Config)

    # Override config (for tests)
    if config_object:
        app.config.update(config_object)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Allow the Vite dev server to make credentialed cross-origin requests
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": frontend_origin}},
        supports_credentials=True,
    )

    from backend.routes.auth_routes import auth_bp
    from backend.routes.quest_routes import quest_bp
    from backend.routes.users_routes import users_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/api")
    app.register_blueprint(quest_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
