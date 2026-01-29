from flask import Flask
from config import Config
from extensions import db, jwt, migrate


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    from routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)

    with app.app_context():
        from models.user import User
        from models.user_stats import UserStats
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
