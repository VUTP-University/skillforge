from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models import Job, JobReport, ReportStatus, User
from app.utils import require_role

reports_bp = Blueprint("reports", __name__)


@reports_bp.post("/")
@jwt_required()
def create_report():
    user_id = int(get_jwt_identity())
    data    = request.get_json() or {}

    job_id = data.get("job_id")
    reason = (data.get("reason") or "").strip()

    if not job_id or not reason:
        return jsonify({"error": "job_id and reason are required"}), 400
    if len(reason) > 500:
        return jsonify({"error": "Reason cannot exceed 500 characters"}), 400

    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    report = JobReport(
        job_id=job_id,
        reporter_id=user_id,
        reason=reason,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201


@reports_bp.get("/")
@require_role("admin", "moderator")
def list_reports():
    status_filter = request.args.get("status")
    query = JobReport.query.order_by(JobReport.created_at.desc())
    if status_filter:
        try:
            query = query.filter(JobReport.status == ReportStatus(status_filter))
        except ValueError:
            pass
    return jsonify([r.to_dict() for r in query.all()])


@reports_bp.patch("/<int:report_id>")
@require_role("admin", "moderator")
def update_report(report_id):
    report = JobReport.query.get_or_404(report_id)
    data   = request.get_json() or {}

    if "status" in data:
        try:
            report.status = ReportStatus(data["status"])
        except ValueError:
            return jsonify({"error": "Invalid status value"}), 400

    if "assigned_to_id" in data:
        aid = data["assigned_to_id"]
        if aid is None:
            report.assigned_to_id = None
        else:
            if not User.query.get(aid):
                return jsonify({"error": "Assigned user not found"}), 404
            report.assigned_to_id = aid

    report.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(report.to_dict())
