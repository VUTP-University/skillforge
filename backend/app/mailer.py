import html
import logging
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import current_app

logger = logging.getLogger(__name__)


_FEATURES = [
    ("JOBS",   "Solve real coding challenges in Python, JavaScript, Java, and C#"),
    ("XP",     "Earn XP for every job you complete and level up your account"),
    ("RANKS",  "Climb 20 hacker-themed ranks, from Guest all the way to 0-Day"),
    ("BOARD",  "Compare your progress against everyone else on the leaderboard"),
]


def _build_welcome_email(to_email: str, username: str, from_name: str, from_addr: str, frontend_origin: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome to SkillForge — your account is live"
    msg["From"] = f"{from_name} <{from_addr}>"
    msg["To"] = to_email

    # Escape for the HTML part — usernames are charset-restricted at
    # registration, but this stays safe for any pre-existing/legacy value.
    username_html = html.escape(username)
    to_email_html = html.escape(to_email)

    text_features = "\n".join(f"  [+] {desc}" for _, desc in _FEATURES)
    text = (
        f"Welcome, {username}_\n\n"
        "Your SkillForge account is live. Compile skills. Deploy your future.\n\n"
        "Here's what's waiting for you:\n"
        f"{text_features}\n\n"
        f"Account\n  Username: {username}\n  Email:    {to_email}\n\n"
        f"Start your first job: {frontend_origin}\n\n"
        "— The SkillForge team\n"
        "© 2026 SkillForge. All rights reserved."
    )

    feature_rows = "\n".join(f"""\
              <tr>
                <td style="padding:0 0 14px;vertical-align:top;width:84px;">
                  <span style="display:inline-block;padding:3px 8px;border:1px solid #2a3a30;border-radius:4px;color:#5dffa3;font-size:11px;font-weight:700;letter-spacing:0.06em;white-space:nowrap;">[ {tag} ]</span>
                </td>
                <td style="padding:0 0 14px;vertical-align:top;font-size:13px;line-height:1.55;color:#c9d6cf;">
                  {desc}
                </td>
              </tr>""" for tag, desc in _FEATURES)

    html_body = f"""\
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Your SkillForge account is ready — pick a job and start earning XP.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050806;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px;width:100%;background:#10151a;border:1px solid #223028;border-radius:10px;overflow:hidden;font-family:Menlo,Consolas,'Courier New',monospace;">

        <!-- Terminal titlebar -->
        <tr>
          <td style="padding:12px 20px;border-bottom:1px solid #223028;">
            <span style="color:#ff5f56;font-size:13px;">&#9679;</span>
            <span style="color:#ffbd2e;font-size:13px;"> &#9679;</span>
            <span style="color:#27c93f;font-size:13px;"> &#9679;</span>
            <span style="color:#6b8478;font-size:11px;letter-spacing:0.05em;float:right;">operator@skillforge: ~</span>
          </td>
        </tr>

        <!-- Brand -->
        <tr>
          <td style="padding:28px 28px 0;">
            <span style="color:#5dffa3;font-size:22px;font-weight:700;letter-spacing:0.02em;">SkillForge</span>
            <div style="color:#6b8478;font-size:12px;margin-top:4px;">Compile skills. Deploy your future.</div>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="padding:22px 28px 4px;">
            <div style="font-size:20px;color:#eafff3;margin-bottom:10px;">Welcome, <span style="color:#5dffa3;">{username_html}</span>_</div>
            <p style="margin:0;font-size:14px;line-height:1.65;color:#c9d6cf;">
              Your account is live. Here's what's waiting for you inside:
            </p>
          </td>
        </tr>

        <!-- Features -->
        <tr>
          <td style="padding:20px 28px 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
{feature_rows}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:10px 28px 26px;">
            <a href="{frontend_origin}" style="display:inline-block;padding:12px 26px;background:#5dffa3;color:#06120b;
              text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;border-radius:6px;">
              [ START YOUR FIRST JOB ]
            </a>
          </td>
        </tr>

        <!-- Account recap -->
        <tr>
          <td style="padding:0 28px 26px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
              style="border:1px solid #223028;border-radius:8px;">
              <tr>
                <td style="padding:14px 18px;font-size:12px;color:#6b8478;border-bottom:1px solid #1a2620;">
                  Username
                </td>
                <td style="padding:14px 18px;font-size:12px;color:#eafff3;text-align:right;border-bottom:1px solid #1a2620;">
                  {username_html}
                </td>
              </tr>
              <tr>
                <td style="padding:14px 18px;font-size:12px;color:#6b8478;">
                  Email
                </td>
                <td style="padding:14px 18px;font-size:12px;color:#eafff3;text-align:right;">
                  {to_email_html}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 28px 26px;border-top:1px solid #1a2620;">
            <p style="margin:0 0 6px;font-size:12px;color:#6b8478;">— The SkillForge team</p>
            <p style="margin:0;font-size:11px;color:#3f5348;">
              You're receiving this because you created an account at SkillForge.<br />
              © 2026 SkillForge. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    return msg


def _build_password_reset_email(to_email: str, username: str, from_name: str, from_addr: str, reset_url: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your SkillForge password"
    msg["From"] = f"{from_name} <{from_addr}>"
    msg["To"] = to_email

    username_html = html.escape(username)
    reset_url_html = html.escape(reset_url)

    text = (
        f"Hey {username}_\n\n"
        "We received a request to reset your SkillForge password.\n\n"
        f"Reset it here: {reset_url}\n\n"
        "This link expires in 1 hour and can only be used once.\n"
        "If you didn't request this, you can safely ignore this email —\n"
        "your password will stay unchanged.\n\n"
        "— The SkillForge team\n"
        "© 2026 SkillForge. All rights reserved."
    )

    html_body = f"""\
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Reset your SkillForge password — this link expires in 1 hour.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#050806;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px;width:100%;background:#10151a;border:1px solid #223028;border-radius:10px;overflow:hidden;font-family:Menlo,Consolas,'Courier New',monospace;">

        <!-- Terminal titlebar -->
        <tr>
          <td style="padding:12px 20px;border-bottom:1px solid #223028;">
            <span style="color:#ff5f56;font-size:13px;">&#9679;</span>
            <span style="color:#ffbd2e;font-size:13px;"> &#9679;</span>
            <span style="color:#27c93f;font-size:13px;"> &#9679;</span>
            <span style="color:#6b8478;font-size:11px;letter-spacing:0.05em;float:right;">operator@skillforge: ~</span>
          </td>
        </tr>

        <!-- Brand -->
        <tr>
          <td style="padding:28px 28px 0;">
            <span style="color:#5dffa3;font-size:22px;font-weight:700;letter-spacing:0.02em;">SkillForge</span>
            <div style="color:#6b8478;font-size:12px;margin-top:4px;">Compile skills. Deploy your future.</div>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="padding:22px 28px 4px;">
            <div style="font-size:20px;color:#eafff3;margin-bottom:10px;">Password reset requested, <span style="color:#5dffa3;">{username_html}</span>_</div>
            <p style="margin:0;font-size:14px;line-height:1.65;color:#c9d6cf;">
              Click below to choose a new password. This link expires in 1 hour and can only be used once.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:20px 28px 26px;">
            <a href="{reset_url_html}" style="display:inline-block;padding:12px 26px;background:#5dffa3;color:#06120b;
              text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.06em;border-radius:6px;">
              [ RESET PASSWORD ]
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 28px 26px;border-top:1px solid #1a2620;">
            <p style="margin:0 0 6px;font-size:12px;color:#6b8478;">— The SkillForge team</p>
            <p style="margin:0;font-size:11px;color:#3f5348;">
              If you didn't request this, you can safely ignore this email.<br />
              © 2026 SkillForge. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    return msg


def _send(msg: MIMEMultipart, server: str, port: int, username: str, password: str) -> None:
    try:
        if port == 465:
            with smtplib.SMTP_SSL(server, port, timeout=10) as smtp:
                smtp.login(username, password)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(server, port, timeout=10) as smtp:
                smtp.starttls()
                smtp.login(username, password)
                smtp.send_message(msg)
    except Exception:
        logger.exception("Failed to send email to %s", msg["To"])


def send_welcome_email(to_email: str, username: str) -> None:
    """Best-effort, non-blocking welcome email. Never raises — a delivery
    failure must never affect registration."""
    config = current_app.config

    if not config.get("MAIL_USERNAME") or not config.get("MAIL_PASSWORD"):
        logger.warning("MAIL_USERNAME/MAIL_PASSWORD not configured — skipping welcome email")
        return

    msg = _build_welcome_email(
        to_email,
        username,
        config.get("MAIL_FROM_NAME", "SkillForge"),
        config.get("MAIL_FROM") or config["MAIL_USERNAME"],
        config.get("FRONTEND_ORIGIN", ""),
    )

    threading.Thread(
        target=_send,
        args=(msg, config["MAIL_SERVER"], config["MAIL_PORT"], config["MAIL_USERNAME"], config["MAIL_PASSWORD"]),
        daemon=True,
    ).start()


def send_password_reset_email(to_email: str, username: str, reset_url: str) -> None:
    """Best-effort, non-blocking password reset email. Never raises — the
    forgot-password endpoint must respond identically whether or not
    delivery actually succeeds."""
    config = current_app.config

    if not config.get("MAIL_USERNAME") or not config.get("MAIL_PASSWORD"):
        logger.warning("MAIL_USERNAME/MAIL_PASSWORD not configured — skipping password reset email")
        return

    msg = _build_password_reset_email(
        to_email,
        username,
        config.get("MAIL_FROM_NAME", "SkillForge"),
        config.get("MAIL_FROM") or config["MAIL_USERNAME"],
        reset_url,
    )

    threading.Thread(
        target=_send,
        args=(msg, config["MAIL_SERVER"], config["MAIL_PORT"], config["MAIL_USERNAME"], config["MAIL_PASSWORD"]),
        daemon=True,
    ).start()
