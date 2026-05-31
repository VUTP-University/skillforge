from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from .config import Config

db      = SQLAlchemy()
migrate = Migrate()
jwt     = JWTManager()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extensions
    CORS(app, supports_credentials=True, origins=app.config["FRONTEND_ORIGIN"])
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Blueprints
    from .routes.health      import health_bp
    from .routes.users       import users_bp
    from .routes.auth        import auth_bp
    from .routes.admin       import admin_bp
    from .routes.quests      import quests_bp
    from .routes.profile     import profile_bp
    from .routes.underworld  import underworld_bp

    app.register_blueprint(health_bp,      url_prefix="/api")
    app.register_blueprint(users_bp,       url_prefix="/api/users")
    app.register_blueprint(auth_bp,        url_prefix="/api/auth")
    app.register_blueprint(admin_bp,       url_prefix="/api/admin")
    app.register_blueprint(quests_bp,      url_prefix="/api/quests")
    app.register_blueprint(profile_bp,     url_prefix="/api")
    app.register_blueprint(underworld_bp,  url_prefix="/api/underworld")

    return app
