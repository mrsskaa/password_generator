# password_generate_team-Begemotiki
Здесь могла быть ваша реклама
=======
# password_generator
практика T1
Данный проект представляет собой систему генерации безопасных паролей по заданным параметрам

### Запуск проекта
- Создайте файл `.env` и вставьте туда credentials для бд

- Для запуска соберите образ с помощью `docker-compose up -d --build`

- Для того чтобы положить контейнеры (на землю) `docker compose down -v`

- Для запуска тестов установите зависимости из `requirements.txt` командой `pip install -r requirements.txt` и введите `pytest`