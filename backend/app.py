from backend.config import Config
from backend.extensions import db, jwt, migrate
from flask import Flask


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

    from backend.routes.auth_routes import auth_bp

    app.register_blueprint(auth_bp)

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
