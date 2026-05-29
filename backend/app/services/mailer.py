import logging
import os
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

logger = logging.getLogger(__name__)


def _get_smtp_settings() -> tuple[str | None, int, str | None, str | None, str, bool, bool]:
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("SMTP_FROM", smtp_user or "noreply@example.com")
    sender_name = os.getenv("SMTP_FROM_NAME", "Password Generator")
    sender = formataddr((sender_name, sender_email))
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    return smtp_host, smtp_port, smtp_user, smtp_password, sender, use_tls, use_ssl


def _send_message(message: EmailMessage) -> None:
    smtp_host, smtp_port, smtp_user, smtp_password, _, use_tls, use_ssl = _get_smtp_settings()
    if not (smtp_host and smtp_user and smtp_password):
        logger.error("SMTP не настроен: письмо не отправлено")
        raise RuntimeError("SMTP не настроен")

    smtp_client: smtplib.SMTP | smtplib.SMTP_SSL
    if use_ssl:
        smtp_client = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
    else:
        smtp_client = smtplib.SMTP(smtp_host, smtp_port, timeout=10)

    with smtp_client as smtp:
        smtp.ehlo()
        if use_tls and not use_ssl:
            smtp.starttls()
            smtp.ehlo()
        smtp.login(smtp_user, smtp_password)
        smtp.send_message(message)


def send_welcome_email(to_email: str | None) -> None:
    if not to_email:
        return

    _, _, _, _, sender, _, _ = _get_smtp_settings()
    msg = EmailMessage()
    msg["Subject"] = "Добро пожаловать в Password Generator"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(
        f"Здравствуйте, {to_email}!\n\n"
        "Ваш аккаунт успешно создан.\n"
        "Спасибо, что пользуетесь сервисом."
    )

    try:
        _send_message(msg)
        logger.info("Приветственное письмо отправлено на %s", to_email)
    except Exception:
        logger.exception("Не удалось отправить приветственное письмо на %s", to_email)


def send_password_reset_code(to_email: str, code: str) -> None:
    _, _, _, _, sender, _, _ = _get_smtp_settings()

    msg = EmailMessage()
    msg["Subject"] = "Код восстановления пароля"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(
        "Ваш код для восстановления пароля:\n\n"
        f"{code}\n\n"
        "Код действует 10 минут."
    )

    try:
        _send_message(msg)
        logger.info("Письмо восстановления отправлено на %s", to_email)
    except Exception:
        logger.exception("Не удалось отправить письмо восстановления на %s", to_email)
        raise


def send_registration_code_email(to_email: str, code: str) -> None:
    _, _, _, _, sender, _, _ = _get_smtp_settings()

    msg = EmailMessage()
    msg["Subject"] = "Код подтверждения регистрации"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(
        "Ваш код подтверждения регистрации:\n\n"
        f"{code}\n\n"
        "Код действует 10 минут.\n"
        "Если вы не создавали аккаунт, просто проигнорируйте это письмо."
    )

    try:
        _send_message(msg)
        logger.info("Письмо с кодом подтверждения регистрации отправлено на %s", to_email)
    except Exception:
        logger.exception("Не удалось отправить письмо подтверждения регистрации на %s", to_email)
        raise
