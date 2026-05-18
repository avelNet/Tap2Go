# 🚀 Tap2Go — Multi-Tenant SaaS Platform

**Tap2Go** — это асинхронная высоконагруженная b2b-платформа для мгновенного взаимодействия гостей с персоналом заведений (компьютерные клубы, бары, кальянные, рестораны) через NFC-метки и QR-коды.

> **Основная цель проекта:** Прокачка хард-скиллов в системном дизайне, асинхронном программировании на Python (FastAPI, SQLAlchemy 2.0) и работе с real-time соединениями (WebSockets).

---

## 🎯 Ключевой функционал

*   **Multi-Tenancy:** Жесткая изоляция данных заведений на уровне базы данных.
*   **Real-time Оповещения:** Мгновенный пуш вызовов на планшет администратора через устойчивые WebSocket-комнаты.
*   **Анти-флуд система:** Защита от спама кнопками вызова на базе TTL-замков в Redis.
*   **Гибкий конструктор UI:** Динамическая мутация мобильного интерфейса (цвета, тексты, модули меню/оплаты) на основе JSON-конфигураций из бэкенда.
*   **Интеграция с СБП:** Готовность архитектуры к обработке идемпотентных вебхуков от банковских API.

---

## 🛠 Технологический стек

*   **Backend:** Python 3.11+, FastAPI, Pydantic v2
*   **Database & ORM:** PostgreSQL, SQLAlchemy 2.0 (Async), asyncpg, Alembic
*   **Cache & Real-time:** Redis (aioredis)
*   **Infrastructure:** Docker, Docker Compose
*   **Frontend:** Vanilla JS / Lightweight CDN Vue.js (полностью делегирован под генерацию ИИ)

---

## 📂 Подробная структура проекта

```text
tap2go/
│
├── .env                       # Конфиденциальные переменные (DB, Redis, JWT-ключи)
├── .env.example               # Шаблон окружения для Git
├── .gitignore                 # Игнорирование __pycache__, .env, .venv, data/
├── Dockerfile                 # Многоэтапная сборка (Multi-stage build) Python-образа
├── docker-compose.yml         # Конфигурация контейнеров (FastAPI, Postgres, Redis)
├── README.md                  # Документация проекта
├── requirements.txt           # Зависимости проекта
│
├── alembic/                   # Каталог миграций Alembic
│   ├── env.py                 # Конфигурация подключения Alembic к асинхронному движку
│   ├── script.py.mako         # Шаблон генерации файлов миграций
│   └── versions/              # Сгенерированные файлы миграций базы данных
│
├── data/                      # Персистентное хранение баз данных (в .gitignore)
│   ├── postgres_data/         # Данные PostgreSQL
│   └── redis_data/            # Данные Redis
│
├── static/                    # Фронтенд (отдается через FastAPI StaticFiles)
│   ├── client.html            # Мобильное приложение гостя (NFC/QR)
│   ├── admin.html             # Планшет-светофор бармена (WebSockets)
│   └── dashboard.html         # Кабинет владельца (CRUD меню, настройки)
│
└── src/                       # Корневая папка бэкенда
    ├── __init__.py
    ├── main.py                # Инициализация FastAPI, мидлварей, CORS, роутеров
    ├── config.py              # Валидация .env через pydantic-settings (Settings-класс)
    ├── database.py            # Настройка async_engine, async_sessionmaker
    ├── exceptions.py          # Кастомные обработчики ошибок (Exception Handlers)
    │
    ├── auth/                  # МОДУЛЬ: Аутентификация B2B (Владельцы)
    │   ├── __init__.py
    │   ├── models.py          # Модель таблицы `companies`
    │   ├── schemas.py         # Схемы Pydantic (UserRegister, UserLogin, Token)
    │   ├── security.py        # Функции хэширования (bcrypt) и работы с JWT
    │   ├── dependencies.py    # Зависимость get_current_company для защиты роутеров
    │   └── router.py          # Роуты: /api/v1/auth/register, /api/v1/auth/login
    │
    ├── companies/             # МОДУЛЬ: Управление заведениями и столами
    │   ├── __init__.py
    │   ├── models.py          # Модели `company_profiles`, `locations`
    │   ├── schemas.py         # Схемы CRUD настроек бренда и генерации столов
    │   ├── service.py         # Бизнес-логика (генерация UUID, проверка лимитов столов)
    │   └── router.py          # Роуты: /api/v1/companies/config, /api/v1/companies/tables
    │
    ├── menu/                  # МОДУЛЬ: Цифровое меню
    │   ├── __init__.py
    │   ├── models.py          # Модель таблицы `menu_items`
    │   ├── schemas.py         # Схемы Pydantic (MenuItemCreate, MenuItemResponse)
    │   ├── service.py         # Логика работы с БД (фильтрация по категориям, стоп-листы)
    │   └── router.py          # Роуты: /api/v1/menu (GET - публичный, POST/PUT/DELETE - защищенный)
    │
    └── runtime/               # МОДУЛЬ: Ядро (Real-time, Вебсокеты, Оплата)
        ├── __init__.py
        ├── models.py          # Модель таблицы `staff_calls`
        ├── schemas.py         # Схемы инициализации экрана гостя и логов вызова
        ├── ws_manager.py      # ConnectionManager для WebSocket-комнат
        ├── services.py        # Логика работы с Redis (Rate Limiting, таймауты чаек)
        ├── webhooks.py        # Роут: /api/v1/runtime/webhook/payment (Прием денег от банка)
        └── router.py          # Роуты: /api/v1/runtime/init/{slug}, /api/v1/runtime/call, /api/v1/runtime/ws/{company_id}
