
<p align="center">
  <img src="assets\image.png" alt="Т1 х МАИ: Генератор безопасных паролей" width="100%">
</p>

=======
## Описание

Данный проект представляет собой веб-приложение для генерации паролей, реализованное в рамках **практики от компании T1**

### Поддерживаемые возможности

* **Генерация паролей**: различные опции, включая добавление специальных символов и исключение похожих.
* **Опция сохранения паролей**: пользователи могут сохранять пароли.
* **История паролей**: можно смотреть ранее сгенерированные пароли.
* **Проверка последовательностей символов**: система может выполнять проверку на наличие простых последовательностей символов, которые могут снижать надежность пароля.
* **Система оценки времени взлома паролей**: отображается примерное время взлома паролей с учётом рассчетов по специальной формуле.
=======
### Запуск проекта
- Скачайте проект с помощью `git clone https://github.com/mrsskaa/password_generator/`.
- В корне проекта создайте `.env` с данными почты и базы данных вида:
  ```.env
  POSTGRES_USER=${user}
  POSTGRES_PASSWORD=${postgres_pwd}
  POSTGRES_DB=password_generator_db
  DATABASE_URL=postgresql+psycopg://${user}:${postgres_pwd}@db:5432/password_generator_db
  MAIL_USERNAME=${your_email@yandex.ru}
  MAIL_PASSWORD=${useryour_app_password}
  SMTP_HOST=smtp.mail.ru
  SMTP_PORT=587
  SMTP_USERNAME=${smtp_username}
  SMTP_PASSWORD=${smtp_pwd}
  SMTP_FROM=${smtp_email}
  SMTP_FROM_NAME=Password Generator App
  SMTP_USE_TLS=true
  DEV_SHOW_CODES_IN_RESPONSE=true
    ```
- Для запуска соберите образ с помощью `docker-compose up -d --build`.
- Для запуска тестов установите зависимости из `requirements.txt` командой `pip install -r requirements.txt` и введите `pytest`.
=======
### Стек
*   **Frontend**: React SPA, HTML5/CSS3, `localStorage` для хранения пользовательских пресетов.
*   **Backend**: Python, FastAPI.
*   **Безопасность/Криптография**: Встроенный модуль Python `secrets` (криптографически безопасный генератор случайных чисел).
*   **Тестирование**: Pytest.
*   **DevOps & Инфраструктура**: Docker, Docker Compose.

#### Основные эндпоинты (API):
*   `POST /generate` - Генерация нового пароля.
    *   *Входные параметры*: длина, флаги использования групп символов, длина запрещенных последовательностей и тп.
    *   *Ответ*: сгенерированный пароль и дополнительные метаданные (рекомендации, оценка надежности).
*   `GET /health` - Мониторинг состояния и проверка доступности backend-сервиса. Возвращает `{"status": "ok"}`.
