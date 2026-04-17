import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def _get_smtp_settings() -> tuple[str | None, int, str | None, str | None, str, bool]:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", smtp_user or "noreply@example.com")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    return smtp_host, smtp_port, smtp_user, smtp_password, sender, use_tls


def send_welcome_email(to_email: str | None, username: str) -> None:
    if not to_email:
        return

    smtp_host, smtp_port, smtp_user, smtp_password, sender, use_tls = _get_smtp_settings()

    if not (smtp_host and smtp_user and smtp_password):
        logger.info(
            "SMTP is not configured. Welcome email skipped for user=%s email=%s",
            username,
            to_email,
        )
        return

    msg = EmailMessage()
    msg["Subject"] = "Welcome to Password Generator"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(
        f"Hello, {username}!\\n\\n"
        "Your account was created successfully.\\n"
        "Have a nice day!"
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as smtp:
            if use_tls:
                smtp.starttls()
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(msg)
        logger.info("Welcome email sent to %s", to_email)
    except Exception:
        logger.exception("Failed to send welcome email to %s", to_email)


def send_password_reset_code(to_email: str, code: str) -> None:
    smtp_host, smtp_port, smtp_user, smtp_password, sender, use_tls = _get_smtp_settings()

    if not (smtp_host and smtp_user and smtp_password):
        logger.error("SMTP is not configured. Failed to send recovery code to %s", to_email)
        raise RuntimeError("SMTP is not configured")

    msg = EmailMessage()
    msg["Subject"] = "Password recovery code"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(
        "Your password recovery code:\n\n"
        f"{code}\n\n"
        "The code expires in 10 minutes."
    )

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as smtp:
            if use_tls:
                smtp.starttls()
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(msg)
        logger.info("Recovery email sent to %s", to_email)
    except Exception:
        logger.exception("Failed to send recovery email to %s", to_email)
        raise
