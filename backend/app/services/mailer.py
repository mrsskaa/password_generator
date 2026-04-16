import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def send_welcome_email(to_email: str | None, username: str) -> None:
    if not to_email:
        return

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", smtp_user or "noreply@example.com")

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
            smtp.starttls()
            smtp.login(smtp_user, smtp_password)
            smtp.send_message(msg)
        logger.info("Welcome email sent to %s", to_email)
    except Exception:
        logger.exception("Failed to send welcome email to %s", to_email)
