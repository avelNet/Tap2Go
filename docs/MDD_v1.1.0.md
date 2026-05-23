# TAP2GO — Design Document v1.2.0

> **Lightweight Multi-Tenant B2B SaaS Platform**  
> Версия: 1.2.0 | Статус: Approved / Ready for Development | Дата: 2026  
> Конфиденциально

---

## Содержание

- [Часть I. Система и концепция](#часть-i-система-и-концепция)
  - [Концепция и ценностное предложение](#концепция-и-ценностное-предложение)
  - [Целевая аудитория](#целевая-аудитория)
  - [Роли в системе](#роли-в-системе)
  - [Иерархия данных](#иерархия-данных)
  - [Стек технологий](#стек-технологий)
  - [Анализ конкурентов](#анализ-конкурентов)
  - [Монетизация](#монетизация)
- [Часть II. Сервисы — порядок реализации](#часть-ii-сервисы--порядок-реализации)
  - [Сервис 01 — Инфраструктура](#сервис-01--инфраструктура)
  - [Сервис 02 — Аутентификация и компания](#сервис-02--аутентификация-и-компания)
  - [Сервис 03 — Управление филиалами](#сервис-03--управление-филиалами)
  - [Сервис 04 — Управление локациями](#сервис-04--управление-локациями)
  - [Сервис 05 — Управление меню](#сервис-05--управление-меню)
  - [Сервис 06 — Управление сотрудниками](#сервис-06--управление-сотрудниками)
  - [Сервис 07 — Guest PWA: инициализация](#сервис-07--guest-pwa-инициализация)
  - [Сервис 08 — Guest PWA: сессии и заказы](#сервис-08--guest-pwa-сессии-и-заказы)
  - [Сервис 09 — Guest PWA: оплата и отзыв](#сервис-09--guest-pwa-оплата-и-отзыв)
  - [Сервис 10 — Staff App](#сервис-10--staff-app)
  - [Сервис 11 — Admin Panel: аналитика](#сервис-11--admin-panel-аналитика)
  - [Сервис 12 — Оптимизация и деплой](#сервис-12--оптимизация-и-деплой)
- [Часть III. Известные проблемы и решения](#часть-iii-известные-проблемы-и-решения)
- [Часть IV. Глоссарий](#часть-iv-глоссарий)

---

# Часть I. Система и концепция

## Концепция и ценностное предложение

Tap2Go — лёгкая мультитенантная B2B SaaS-платформа для заведений с высоким трафиком и молодой аудиторией (18-35 лет).

**Главная цель** — поднять средний чек через доступность заказа в любой момент без ожидания персонала.

Гость касается NFC-метки на столе — мгновенно открывается интерфейс в браузере, никаких приложений и регистраций. Выбирает из меню, оформляет заказ, при необходимости вызывает персонала. Всё это не вставая с места и не дожидаясь когда официант освободится.

**Ключевые принципы:**

- **Zero-Install UX** — никаких приложений, регистраций и паролей для гостя. Коснулся метки — мгновенно открылся интерфейс в браузере
- **Revenue First** — меню и заказы — ядро продукта. Вызов персонала — вспомогательная функция
- **Multi-Tenancy** — единый код, единая БД. Полная изоляция данных по `company_id` и `branch_id`
- **Настраивается под бизнес** — feature-флаги позволяют включить только нужный функционал под конкретный тип заведения
- **Масштабируется на сети** — иерархия `company → branch → location`. Владелец сети видит всё, управляющий точки видит только своё

---

## Целевая аудитория

Заведения где гость сидит какое-то время, есть что дозаказать, персонал всегда занят, аудитория молодая:

- Лан-центры и ПК-клубы
- Кальянные
- Крафтовые пабы и бары
- Антикафе, боулинг, бильярд

**Не наша история:** фастфуд (нет посадки), дорогие рестораны (живое общение — часть опыта).

---

## Роли в системе

| Роль | Зона ответственности |
|------|----------------------|
| **Owner** | Владелец бренда/сети. Создаёт компанию и филиалы, назначает Branch Admin, видит всю аналитику по сети, может просматривать любой филиал. Физически может не присутствовать. |
| **Branch Admin** | Управляющий конкретной точки. Основной контакт при внедрении. Настраивает филиал: столы, NFC, меню, сотрудники, feature-флаги. Видит только свой филиал. |
| **Staff** | Сотрудник заведения. Только Staff App. Получает push-уведомления, видит активные столы и заказы своего филиала, принимает вызовы. |

---

## Иерархия данных

Ключевая структура: `companies → branches → locations`. Все транзакционные данные содержат `company_id` и `branch_id` для полной изоляции.

| Родитель | Тип связи | Потомок | Ключ |
|----------|-----------|---------|------|
| companies | 1 : 1 | company_profiles | company_id |
| companies | 1 : N | branches | company_id |
| branches | 1 : N | locations | branch_id |
| companies | 1 : N | menu_items | company_id |
| branches | 1 : N | branch_menu_overrides | branch_id |
| menu_items | 1 : N | branch_menu_overrides | menu_item_id |
| branches | 1 : N | staff_members | branch_id |
| staff_members | 1 : N | push_subscriptions | staff_member_id |
| branches | 1 : N | sessions | branch_id |
| sessions | 1 : N | orders | session_id |
| orders | 1 : N | order_items | order_id |
| sessions | 0 : 1 | reviews | session_id |
| branches | 1 : N | staff_calls | branch_id |

---

## Стек технологий

| Уровень | Технология | Назначение |
|---------|-----------|-----------|
| Backend | FastAPI (Python) | Async REST API |
| ORM | SQLAlchemy + Alembic | Модели данных и миграции |
| Database | PostgreSQL 15+ | Основное хранилище, мультитенантность |
| Cache / Rate Limit | Redis | TTL-ключи защиты от спама, кэш конфигов |
| Frontend | React + Vite | Guest PWA, Staff App, Admin Panel |
| Push уведомления | Browser Push (PWA) | Уведомления сотрудников, бесплатно |
| Auth | JWT + argon2id | Аутентификация, роли |
| CDN / Статика | S3-совместимое хранилище | Изображения меню, логотипы |
| Containerization | Docker + docker-compose | Деплой и разработка |

---

## Анализ конкурентов

| Конкурент | Тип | Почему не наш сегмент |
|-----------|-----|----------------------|
| Restik, Zenky, Smartofood, QRLip | QR-меню сервисы | Заточены под рестораны с POS-интеграцией (iiko, r_keeper). Тяжёлые, не для малого бизнеса. |
| r_keeper QR-меню | QR-меню модуль | 3000р/мес только за QR без NFC и без нашего функционала. Требует их POS-системы. |
| iBells и физические кнопки | Аппаратные системы | Железо, батарейки, табло на стене. Нет меню, нет аналитики, нет digital. |
| Saby Presto (СБИС) | Тяжёлая ERP | Полноценная POS-система. Избыточна и дорога для нашей ЦА. |

**Наша ниша свободна** — лёгкая digital система с NFC, меню, вызовом персонала и аналитикой для малого и сетевого бизнеса без POS-интеграции.

---

## Монетизация

### Тестовый период
- **1 000 р/месяц** — первые 2-3 месяца
- Полный функционал, ограничение до 5 столов
- NFC-метки за счёт платформы как вложение в клиента
- Цель: вовлечённость и реальный фидбек, а не деньги
- Фильтр несерьёзных клиентов — кто не готов платить даже тысячу, тот не готов к продукту

### Полная подписка
- **5 000 р/месяц** фиксированно
- NFC-метки включены в стоимость как физический онбординг
- Browser Push уведомления — бесплатно
- Без ограничений по столам и сотрудникам
- SMS и Telegram не используем

---

# Часть II. Сервисы — порядок реализации

---

## Сервис 01 — Инфраструктура

> PostgreSQL · Redis · Docker · FastAPI skeleton

### Что реализуется

Базовый фундамент проекта. Всё остальное строится поверх этого сервиса.

### Структура папок

```
tap2go/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Точка входа FastAPI
│   │   ├── config.py            # Настройки из .env
│   │   ├── core/
│   │   │   ├── database.py      # SQLAlchemy engine, SessionLocal
│   │   │   └── redis.py         # Redis client
│   │   └── models/
│   │       └── base.py          # Base declarative model
│   ├── migrations/
│   │   ├── alembic.ini
│   │   ├── env.py
│   │   └── versions/
│   ├── requirements.txt
│   └── .env.example
├── docker/
│   ├── Dockerfile.backend
│   └── docker-compose.yml
└── README.md
```

### Переменные окружения (.env)

```env
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/tap2go
REDIS_URL=redis://redis:6379/0
SECRET_KEY=<minimum_32_chars_random>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=["https://app.domain.ru"]
S3_ENDPOINT=https://storage.example.com
S3_BUCKET=tap2go-media
S3_ACCESS_KEY=<access_key>
S3_SECRET_KEY=<secret_key>
S3_REGION=ru-central1
VAPID_PRIVATE_KEY=<generated via web-push generate-vapid-keys>
VAPID_PUBLIC_KEY=<generated via web-push generate-vapid-keys>
VAPID_SUBJECT=mailto:admin@domain.ru
```

> VAPID ключи генерируются один раз командой `npx web-push generate-vapid-keys` и фиксируются в `.env`. Без них Browser Push не работает вообще.

### Docker Compose

```yaml
services:
  backend:
    build: ./docker/Dockerfile.backend
    env_file: .env
    depends_on: [db, redis]
    ports: ["8000:8000"]
  db:
    image: postgres:15-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  frontend:
    build: ./docker/Dockerfile.frontend
    ports: ["3000:80"]
```

### Результат сервиса

- FastAPI запускается, healthcheck эндпоинт отвечает
- PostgreSQL подключён, Alembic инициализирован
- Redis подключён
- `docker-compose up` поднимает всё окружение

### Фронтенд роутинг

Три приложения живут на одном домене, разделяются по URL-префиксу:

| Префикс | Приложение | Описание |
|---------|-----------|---------|
| `/space/*` | Guest PWA | Клиентский интерфейс, открывается по NFC-метке |
| `/staff/*` | Staff App | Приложение сотрудников (join, login, dashboard) |
| `/admin/*` | Admin Panel | Панель управления для Owner и Branch Admin |

Nginx отдаёт единый `index.html` для всех трёх префиксов — React Router обрабатывает маршруты на клиенте. Backend API доступен по `/api/*`.

```nginx
location /space/ { try_files $uri /index.html; }
location /staff/  { try_files $uri /index.html; }
location /admin/  { try_files $uri /index.html; }
location /api/    { proxy_pass http://backend:8000; }
```

---

## Сервис 02 — Аутентификация и компания

> Регистрация · Логин · JWT · Роли

### Что реализуется

Регистрация компании, логин, выдача JWT токена. Middleware проверки токена и изоляции по `company_id`.

### Таблицы БД

#### `companies`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор компании |
| name | VARCHAR(200) | NOT NULL | Публичное название бренда ('Туман', 'PC Club Центр') |
| slug | VARCHAR(100) | UK, NOT NULL | URL-friendly идентификатор для роутинга |
| email | VARCHAR(255) | UK, NOT NULL | Email для входа в Admin Panel |
| password_hash | VARCHAR(255) | NOT NULL | Хэш пароля (argon2id). Plaintext не хранится |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | false = мгновенная блокировка всех эндпоинтов компании |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата регистрации |
| updated_at | TIMESTAMP | NOT NULL | Дата последнего обновления |

#### `company_profiles`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| company_id | UUID | PK, FK | Внешний ключ на companies.id |
| theme_color | VARCHAR(7) | NOT NULL, DEFAULT '#000000' | HEX-цвет для брендинга кнопок и акцентов |
| logo_url | VARCHAR(500) | NULLABLE | URL логотипа компании в CDN/S3 |
| primary_cta_text | VARCHAR(100) | NOT NULL | Текст кнопки вызова ('Вызвать персонал') |
| is_menu_active | BOOLEAN | NOT NULL, DEFAULT false | Включён ли цифровой каталог |
| is_bill_active | BOOLEAN | NOT NULL, DEFAULT false | Включена ли кнопка 'Готов к оплате' |
| updated_at | TIMESTAMP | NOT NULL | Дата последнего изменения конфигурации |

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| POST | `/api/v1/auth/register` | Public | Регистрация новой компании |
| POST | `/api/v1/auth/login` | Public | Логин. Возвращает JWT токен |
| GET | `/api/v1/auth/me` | Owner | Данные текущего аккаунта |
| PATCH | `/api/v1/auth/profile` | Owner | Обновление брендинга и настроек |

### Структура папок

```
backend/app/
├── api/v1/
│   ├── router.py
│   ├── endpoints/
│   │   └── auth.py
│   └── schemas/
│       └── company.py
├── models/
│   └── company.py          # Company, CompanyProfile
├── core/
│   └── security.py         # JWT, password hashing
└── middleware/
    └── auth.py             # JWT validation middleware
```

### JWT Payload

```json
{
  "company_id": "uuid",
  "role": "owner | branch_admin | staff",
  "branch_id": "uuid (для branch_admin и staff)",
  "staff_member_id": "uuid (только для staff)",
  "exp": 1234567890
}
```

> `company_id` присутствует во всех токенах — Owner, Branch Admin и Staff. Middleware использует его для изоляции данных без дополнительного запроса в БД.

### Refresh Token

Access Token истекает через 60 минут. Для Staff App критично — сотрудники работают сменами 8-12 часов без повторного входа.

**Схема:**
- При логине выдаётся пара: `access_token` (60 мин) + `refresh_token` (30 дней, хранится в `httpOnly cookie`)
- Когда Access Token истёк — фронтенд автоматически делает `POST /api/v1/auth/refresh`
- Сервер проверяет refresh токен, выдаёт новую пару
- Если refresh тоже истёк — редирект на экран входа

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| POST | `/api/v1/auth/refresh` | Public (cookie) | Обновить access token по refresh token |
| POST | `/api/v1/auth/logout` | Auth | Инвалидировать refresh token |

### Логика middleware

1. Извлечь токен из `Authorization: Bearer {token}`
2. Декодировать и проверить подпись и срок действия
3. Проверить `companies.is_active` — если false вернуть 403
4. Добавить `company_id` и `role` в `request.state`

### Результат сервиса

- Компания может зарегистрироваться и получить JWT токен
- Все защищённые эндпоинты проверяют токен через middleware
- Неактивная компания получает 403 на любой запрос

---

## Сервис 03 — Управление филиалами

> CRUD филиалов · Назначение Branch Admin

### Что реализуется

Owner создаёт филиалы (точки сети), назначает Branch Admin. Филиал — основная единица изоляции операционных данных.

### Таблица БД

#### `branches`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор филиала |
| company_id | UUID | FK, NOT NULL | Ссылка на companies.id |
| name | VARCHAR(200) | NOT NULL | Название точки ('Туман на Ленина', 'PC Club Центр') |
| address | VARCHAR(500) | NULLABLE | Физический адрес заведения |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | false = точка временно закрыта |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата создания |
| updated_at | TIMESTAMP | NOT NULL | Дата последнего обновления |

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| GET | `/api/v1/admin/branches` | Owner | Список всех филиалов со статусом настройки |
| POST | `/api/v1/admin/branches` | Owner | Создать новый филиал |
| GET | `/api/v1/admin/branches/{id}` | Owner | Детали филиала |
| PATCH | `/api/v1/admin/branches/{id}` | Owner | Обновить название, адрес, статус |
| POST | `/api/v1/admin/branches/{id}/admin` | Owner | Назначить Branch Admin. Создаёт `staff_member` с `role='branch_admin'` для указанного филиала. |

### Статус настройки филиала

Owner видит индикатор готовности каждого филиала. Филиал считается настроенным если:

- Добавлен хотя бы один стол (location)
- Добавлен хотя бы один сотрудник (staff_member)
- Добавлено меню если `is_menu_active=true`

### Результат сервиса

- Owner создаёт и управляет филиалами
- Owner видит статус настройки каждого филиала
- Branch Admin назначен и может входить в свой филиал

---

## Сервис 04 — Управление локациями

> CRUD столов · Генерация UUID slug для NFC

### Что реализуется

Branch Admin создаёт столы/места. Система генерирует криптографически непредсказуемый UUID slug который вшивается в NFC-метку.

### Таблица БД

#### `locations`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Внутренний идентификатор |
| branch_id | UUID | FK, NOT NULL | Ссылка на branches.id |
| company_id | UUID | FK, NOT NULL | Денормализован для быстрых запросов |
| slug | UUID | UK, NOT NULL | Публичный криптографический UUID — вшивается в NFC-метку |
| display_name | VARCHAR(100) | NOT NULL | Человекочитаемое имя ('Стол #5', 'VIP-ПК 14') |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | false = место временно недоступно |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата создания |
| updated_at | TIMESTAMP | NOT NULL | Дата обновления |

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| GET | `/api/v1/admin/locations` | Branch Admin | Список всех мест своего филиала |
| POST | `/api/v1/admin/locations` | Branch Admin | Создать новое место. Автогенерация UUID slug |
| GET | `/api/v1/admin/locations/{id}` | Branch Admin | Детали места + готовый URL для NFC |
| PATCH | `/api/v1/admin/locations/{id}` | Branch Admin | Переименовать, включить/выключить |
| DELETE | `/api/v1/admin/locations/{id}` | Branch Admin | Удалить (только если нет активных сессий) |

### NFC онбординг

1. Branch Admin создаёт место в Admin Panel — вводит название ('Стол 5')
2. Система генерирует UUID slug и формирует URL: `https://app.domain.ru/space/{company_slug}/{location_slug}`
3. Admin Panel отображает этот URL
4. Branch Admin скачивает NFC Tools на телефон
5. Подносит телефон к чистой NFC-метке — записывает URL
6. Приклеивает метку на стол — готово

### Поведение при неактивной локации

Если `locations.is_active = false`:

| Сценарий | Поведение |
|---------|----------|
| Гость касается метки (нет активной сессии) | `GET /runtime/init/{slug}` возвращает `{ active: false }`. Guest PWA показывает экран "Место временно недоступно". |
| Гость уже в активной сессии на этом столе | Сессия продолжается до завершения. Новые заказы принимаются. Стол выключается "мягко" — только новые сессии не создаются. |
| Branch Admin пытается удалить локацию с активной сессией | `DELETE /admin/locations/{id}` возвращает 409 Conflict. Сначала нужно дождаться завершения сессии. |

### Результат сервиса

- Branch Admin создаёт столы и получает готовые URL для NFC-меток
- Места можно включать/выключать без замены физической метки
- Гость на выключенном столе видит понятный экран вместо ошибки

---

## Сервис 05 — Управление меню

> CRUD позиций · Категории · Стоп-лист

### Что реализуется

Owner управляет общим каталогом сети. Branch Admin управляет стоп-листом своей точки.

### Таблицы БД

#### `menu_items`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор позиции |
| company_id | UUID | FK, NOT NULL | Меню единое для всей сети |
| name | VARCHAR(200) | NOT NULL | Название ('Кружка пива', 'Доп. час', 'Кальян фрукт') |
| category | VARCHAR(100) | NOT NULL | Категория ('drinks', 'food', 'services') |
| price | DECIMAL(10,2) | NOT NULL | Цена |
| image_url | VARCHAR(500) | NULLABLE | URL изображения в CDN. WebP формат. |
| is_available | BOOLEAN | NOT NULL, DEFAULT true | Глобальная доступность во всей сети. false = скрыто везде. |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата добавления |
| updated_at | TIMESTAMP | NOT NULL | Дата последнего изменения |

#### `branch_menu_overrides`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор записи |
| branch_id | UUID | FK, NOT NULL | Филиал |
| company_id | UUID | FK, NOT NULL | Денормализован |
| menu_item_id | UUID | FK, NOT NULL | Позиция меню |
| is_available | BOOLEAN | NOT NULL, DEFAULT false | false = позиция в стоп-листе этого филиала |
| updated_at | TIMESTAMP | NOT NULL | Дата последнего изменения |

> **UNIQUE constraint:** `(branch_id, menu_item_id)` — одна запись на пару филиал+позиция.

**Логика стоп-листа при формировании каталога (runtime/init):**
- Берём все `menu_items` где `is_available = true` (глобально активны)
- LEFT JOIN с `branch_menu_overrides` для данного `branch_id`
- Если запись в overrides есть и `is_available = false` — позиция исключается из каталога
- Если записи нет — позиция доступна (default поведение)

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| GET | `/api/v1/admin/menu` | Branch Admin+ | Список всего каталога компании |
| POST | `/api/v1/admin/menu` | Owner | Добавить позицию в общий каталог |
| PATCH | `/api/v1/admin/menu/{id}` | Owner | Обновить название, цену, фото, категорию |
| PATCH | `/api/v1/admin/menu/{id}/toggle` | Branch Admin | Включить/выключить позицию на своей точке (стоп-лист) |
| PATCH | `/api/v1/admin/menu/{id}/global-toggle` | Owner | Глобально включить/выключить позицию для всей сети |
| DELETE | `/api/v1/admin/menu/{id}` | Owner | Удалить позицию из каталога |
| POST | `/api/v1/admin/upload/image` | Branch Admin+ | Загрузить изображение в S3. Возвращает `{ image_url }`. |

### Загрузка изображений

```
POST /api/v1/admin/upload/image
Content-Type: multipart/form-data
Body: file=<image file>

Response: { "image_url": "https://cdn.example.com/media/uuid.webp" }
```

Сервер принимает JPEG/PNG/WebP до 5 MB, конвертирует в WebP через `Pillow`, загружает в S3 с публичным доступом, возвращает CDN URL. Branch Admin вставляет этот URL в поле `image_url` при создании/редактировании позиции.

### Инвалидация Redis кэша

При любом изменении меню (добавление, редактирование, toggle) бэкенд должен сбросить кэш `runtime/init` для всех локаций затронутого филиала:

```python
# При изменении menu_items (глобальное) — сбрасываем кэш всех локаций компании
# При изменении branch_menu_overrides — сбрасываем кэш локаций конкретного филиала

async def invalidate_branch_cache(branch_id: UUID, db: AsyncSession, redis: Redis):
    slugs = await db.scalars(
        select(Location.slug).where(Location.branch_id == branch_id)
    )
    keys = [f"cache:init:{slug}" for slug in slugs]
    if keys:
        await redis.delete(*keys)
```

Вызывается в конце каждого эндпоинта изменения меню и профиля компании.

### Оптимизация изображений

- Загружаются в S3-совместимое хранилище
- Конвертируются в WebP при загрузке
- Отдаются через CDN с кэшированием
- Lazy loading на фронтенде

### Результат сервиса

- Owner управляет единым каталогом для всей сети
- Branch Admin управляет стоп-листом своей точки

---

## Сервис 06 — Управление сотрудниками

> CRUD staff · Выдача доступа к Staff App

### Что реализуется

Branch Admin добавляет сотрудников и выдаёт им доступ к Staff App.

### Таблица БД

#### `staff_members`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор сотрудника |
| company_id | UUID | FK, NOT NULL | Денормализован |
| branch_id | UUID | FK, NOT NULL | Сотрудник работает в конкретном филиале |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'staff' | Роль: `branch_admin` \| `staff` |
| name | VARCHAR(200) | NOT NULL | Имя сотрудника |
| login | VARCHAR(100) | NOT NULL | Короткий логин для входа (уникален в рамках филиала) |
| pin_hash | VARCHAR(255) | NULLABLE | Хэш PIN-кода (argon2id). NULL пока сотрудник не прошёл онбординг |
| invite_token | VARCHAR(64) | NULLABLE, UK | Одноразовый токен приглашения. NULL после активации |
| invite_expires_at | TIMESTAMP | NULLABLE | Срок действия токена приглашения (48 часов) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | false = доступ к Staff App заблокирован |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата добавления |
| updated_at | TIMESTAMP | NOT NULL | Дата обновления |

> **UNIQUE constraint:** `(branch_id, login)` — логин уникален внутри филиала. Исключает неоднозначность при входе по `login + PIN`.

### Механизм аутентификации Staff

Staff App использует PIN-код (4-6 цифр) вместо пароля — быстро, удобно на телефоне.

**Онбординг (первый вход):**
1. Branch Admin создаёт сотрудника → система генерирует `invite_token` (64 символа, crypto-random) и устанавливает `invite_expires_at = NOW() + 48h`
2. Branch Admin отправляет ссылку: `https://app.domain.ru/staff/join/{invite_token}`
3. Сотрудник открывает ссылку → видит форму: имя (предзаполнено) + придумать логин (короткий, уникальный в филиале) + придумать PIN
4. POST `/api/v1/staff/auth/activate` — сохраняет `login`, `pin_hash`, обнуляет `invite_token` и `invite_expires_at`
5. Система возвращает JWT токен Staff — сотрудник авторизован
6. Staff App предлагает добавить на домашний экран и разрешить push

**Повторный вход (токен протух или новый телефон):**
1. Сотрудник открывает `https://app.domain.ru/staff/login`
2. Вводит свой логин и PIN-код
3. POST `/api/v1/staff/auth/login` с `{ branch_id, login, pin }` — система находит сотрудника по `(branch_id, login)` и проверяет PIN
4. Возвращает новый JWT токен

> PIN не является секретом уровня пароля — он защищает от случайного доступа, не от целенаправленной атаки. Для Staff App этого достаточно.

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| GET | `/api/v1/admin/staff` | Branch Admin | Список сотрудников своего филиала |
| POST | `/api/v1/admin/staff` | Branch Admin | Добавить сотрудника |
| PATCH | `/api/v1/admin/staff/{id}` | Branch Admin | Обновить имя, активность |
| DELETE | `/api/v1/admin/staff/{id}` | Branch Admin | Удалить сотрудника |
| POST | `/api/v1/admin/staff/{id}/invite` | Branch Admin | Сгенерировать/перевыпустить ссылку приглашения |
| POST | `/api/v1/staff/auth/activate` | Public | Активация по invite_token. Установить PIN, получить JWT. |
| POST | `/api/v1/staff/auth/login` | Public | Повторный вход по branch_id + login + PIN. Получить JWT. |

### Онбординг сотрудника

1. Branch Admin создаёт запись сотрудника в Admin Panel — вводит имя
2. Нажимает 'Пригласить' — система генерирует `invite_token` (48 часов)
3. Branch Admin отправляет ссылку сотруднику (мессенджер, лично)
4. Сотрудник открывает ссылку → видит форму с именем, полем для логина (короткое уникальное имя) и полем для PIN (4-6 цифр)
5. Вводит логин и PIN → POST `/staff/auth/activate` → получает JWT, авторизован
6. Safari/Chrome предлагает добавить на домашний экран — добавляет
7. Staff App запрашивает разрешение на push — разрешает
8. Готово. Push приходят даже при свёрнутом приложении

**Повторный вход** (новый телефон, протух токен браузера): открывает `/staff/login`, вводит логин и PIN — получает новый JWT.

### Результат сервиса

- Branch Admin управляет командой своего филиала
- Сотрудники подключены к Staff App через простой онбординг
- Push уведомления настроены и работают

---

## Сервис 07 — Guest PWA: инициализация

> runtime/init · Конфиг по slug · Redis кэш

### Что реализуется

Гость касается NFC-метки — открывается Guest PWA. Единственный HTTP-запрос возвращает всю конфигурацию UI. Кэшируется в Redis.

### URL структура

```
https://app.domain.ru/space/{company_slug}/{location_slug}
```

### API эндпоинт

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| GET | `/api/v1/runtime/init/{location_slug}` | Public | Инициализация Guest PWA. Ответ кэшируется в Redis 5 мин. |

### Поток данных

| # | Слой | Действие |
|---|------|---------|
| 1 | Guest PWA | Извлечь `location_slug` из URL |
| 2 | FastAPI | Проверить Redis: `EXISTS cache:init:{location_slug}` |
| 3a | Redis (cache HIT) | Вернуть JSON из кэша — не идём в БД |
| 3b | PostgreSQL (cache MISS) | JOIN: locations + branches + companies + company_profiles |
| 4 | FastAPI | Проверить `companies.is_active` — если false вернуть 403 |
| 5 | PostgreSQL | Если `is_menu_active=true` — добавить menu_items |
| 6 | Redis | SET `cache:init:{location_slug}` EX 300 |
| 7 | FastAPI → Guest PWA | Вернуть JSON конфигурацию |
| 8 | Guest PWA | Применить `theme_color` к CSS, показать лого, установить тексты |
| 9 | Guest PWA | Условный рендер: MenuCatalog, BillButton по feature-флагам |

### JSON ответ runtime/init

```json
{
  "company": {
    "name": "Туман",
    "theme_color": "#FF5733",
    "logo_url": "https://cdn.example.com/logo.webp"
  },
  "location": {
    "id": "uuid",
    "display_name": "Стол #5"
  },
  "features": {
    "is_menu_active": true,
    "is_bill_active": true
  },
  "copy": {
    "primary_cta_text": "Вызвать мастера"
  },
  "catalog": [
    {
      "id": "uuid",
      "name": "Кружка пива",
      "price": 350,
      "category": "drinks",
      "image_url": "https://cdn.example.com/beer.webp"
    }
  ]
}
```

### Оптимизация

- **Service Worker** — кэширует оболочку PWA. Повторное открытие из кэша
- **Redis кэш** — TTL 5 минут. Мгновенная инвалидация при изменении конфига
- **Lazy loading** — MenuCatalog и BillButton грузятся только при необходимости

### Результат сервиса

- Гость касается метки — интерфейс открывается менее чем за 1 секунду
- Брендинг и меню адаптированы под конкретное заведение

---

## Сервис 08 — Guest PWA: сессии и заказы

> Сессия · Корзина · Orders · Order Items

### Что реализуется

Открытие и ведение сессии гостя. Корзина, оформление заказа, дозаказы в течение сессии. Push сотрудникам при каждом новом заказе.

### Таблицы БД

#### `sessions`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор сессии |
| company_id | UUID | FK, NOT NULL | Денормализован |
| branch_id | UUID | FK, NOT NULL | Филиал где открыта сессия |
| location_id | UUID | FK, NOT NULL | Конкретный стол/место |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | active \| bill_requested \| completed |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Момент первого касания NFC |
| completed_at | TIMESTAMP | NULLABLE | Момент закрытия сессии |
| auto_closed | BOOLEAN | NOT NULL, DEFAULT false | true = закрылась по таймауту |
| updated_at | TIMESTAMP | NOT NULL | Дата последнего изменения статуса. Используется планировщиком автозакрытия. |

> **Partial unique index:** `CREATE UNIQUE INDEX uq_location_active_session ON sessions (location_id) WHERE status = 'active'` — защита от одновременного касания. Обычный UNIQUE constraint здесь не подойдёт, нужен именно partial index по условию.

#### `orders`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор заказа |
| session_id | UUID | FK, NOT NULL | Сессия в рамках которой сделан заказ |
| company_id | UUID | FK, NOT NULL | Денормализован |
| branch_id | UUID | FK, NOT NULL | Денормализован |
| location_id | UUID | FK, NOT NULL | Денормализован |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending \| confirmed |
| total_amount | DECIMAL(10,2) | NOT NULL | Сумма заказа |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Момент оформления |

> **Статусы заказа:** `pending` — заказ создан гостем, ожидает подтверждения. `confirmed` — сотрудник нажал "Взять" на вызове связанном с этим столом, или подтвердил вручную. В MVP статус `confirmed` **не является блокирующим** — система работает без явного подтверждения каждого заказа. Push уведомление = сигнал для персонала. Статус `confirmed` зарезервирован для версии 1.1 где Staff App получит возможность управлять заказами явно.

#### `order_items`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор позиции |
| order_id | UUID | FK, NOT NULL | Заказ к которому относится |
| menu_item_id | UUID | FK, NOT NULL | Ссылка на позицию каталога |
| name_at_order | VARCHAR(200) | NOT NULL | Название зафиксировано на момент заказа |
| price_at_order | DECIMAL(10,2) | NOT NULL | Цена зафиксирована на момент заказа |
| quantity | INTEGER | NOT NULL | Количество единиц |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Момент добавления |

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| POST | `/api/v1/runtime/session/open` | Public | Открыть сессию. Если активная есть — вернуть её. |
| POST | `/api/v1/runtime/order` | Public | Оформить заказ. Push сотрудникам. |
| GET | `/api/v1/runtime/session/current` | Public | Текущее состояние: статус + заказы + итого |

### Поток данных — заказ

| # | Слой | Действие |
|---|------|---------|
| 1 | Гость / NFC | Касание метки |
| 2 | Guest PWA | POST `/runtime/session/open` с `location_slug` |
| 3 | FastAPI / PostgreSQL | Проверить активную сессию. Если есть — вернуть. Если нет — создать. |
| 4 | Guest PWA | Гость просматривает меню, добавляет позиции в корзину |
| 5 | Guest PWA | POST `/runtime/order` с `[{ menu_item_id, quantity }]` |
| 6 | FastAPI / PostgreSQL | Зафиксировать `name_at_order` и `price_at_order`. Создать order + order_items. |
| 7 | FastAPI / Push | Browser Push всем сотрудникам `branch_id`: 'Стол 5 — новый заказ: 700р' |
| 8 | Гость | Может дозаказывать — каждый раз новый `order` в той же `session` |

### Восстановление сессии

При повторном открытии метки Guest PWA проверяет `localStorage` на наличие `session_id`. Если есть — загружает текущее состояние. Гость видит предыдущие заказы и продолжает.

### Результат сервиса

- Гость заказывает из меню, заказы копятся в рамках сессии
- Сотрудники получают push при каждом новом заказе
- Цена и название позиций фиксируются на момент заказа

---

## Сервис 09 — Guest PWA: оплата и отзыв

> Вызов персонала · Bill Request · Закрытие сессии · Review

### Что реализуется

Вызов персонала, процесс оплаты с подтверждением, автоматическое закрытие сессии по таймауту, экран отзыва с перехватом негативных оценок.

### Таблицы БД

#### `staff_calls`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор вызова |
| company_id | UUID | FK, NOT NULL | Денормализован |
| branch_id | UUID | FK, NOT NULL | Филиал — для Push роутинга |
| location_id | UUID | FK, NOT NULL | Стол откуда вызов |
| call_type | VARCHAR(20) | NOT NULL | `staff_call` = вызов \| `bill_request` = готов к оплате |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | active \| taken \| resolved \| cancelled |
| taken_by | UUID | FK, NULLABLE | `staff_member_id` кто взял вызов |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Момент нажатия кнопки |
| resolved_at | TIMESTAMP | NULLABLE | Момент закрытия вызова |

#### `reviews`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор отзыва |
| session_id | UUID | FK, NOT NULL | Сессия после которой оставлен отзыв |
| company_id | UUID | FK, NOT NULL | Денормализован |
| branch_id | UUID | FK, NOT NULL | Денормализован |
| location_id | UUID | FK, NOT NULL | Денормализован |
| rating | SMALLINT | NOT NULL | Оценка 1-5 |
| comment | TEXT | NULLABLE | Комментарий при оценке 1-3 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Момент отправки |

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| POST | `/api/v1/runtime/call` | Public | Вызов персонала. Redis rate limit 60 сек. |
| POST | `/api/v1/runtime/bill` | Public | Запрос оплаты. Сессия → `bill_requested`. |
| POST | `/api/v1/runtime/complete` | Public | Подтверждение оплаты. Закрывает сессию. |
| POST | `/api/v1/runtime/review` | Public | Отправить отзыв 1-5. |
| PATCH | `/api/v1/staff/calls/{id}/take` | Staff | Взять вызов. |
| PATCH | `/api/v1/staff/calls/{id}/resolve` | Staff | Закрыть вызов. |

### Поток данных — оплата

| # | Слой | Действие |
|---|------|---------|
| 1 | Гость | Нажимает 'Готов к оплате' |
| 2 | Guest PWA | Экран подтверждения: итог из системы + кнопки 'Подтвердить' и 'Отмена' |
| 3a | Гость (отмена) | Возврат к обычному интерфейсу |
| 3b | Гость (подтверждение) | POST `/runtime/bill` |
| 4 | FastAPI / PostgreSQL | Статус сессии → `bill_requested`. Меню заблокировано. |
| 5 | FastAPI / Push | Push всем сотрудникам: 'Стол 5 — готов к оплате. 1 200р' |
| 6 | Сотрудник | Приходит с терминалом. Принимает оплату. |
| 7 | Гость | Нажимает 'Я оплатил' — POST `/runtime/complete` |
| 8 | FastAPI / PostgreSQL | Статус сессии → `completed`. `completed_at = NOW()`. |
| 9 | Guest PWA | Показывает экран отзыва (1-5 звёзд) |

### Redis rate limit для вызова

```
1. EXISTS lock:call:{branch_id}:{location_id}
2. Если есть → 429 Too Many Requests: "Персонал уже в пути"
3. Если нет  → SET lock:call:{branch_id}:{location_id} EX 60
```

Атомарная операция `SET NX` — защита от race condition.

### Логика отзыва

- **Оценка 4-5** → редирект на Яндекс Карты или 2GIS
- **Оценка 1-3** → форма комментария внутри системы. Push Branch Admin и Owner: 'Стол 5 — негативный отзыв (2/5)'
- Плохой отзыв не уходит в публичное пространство

### Автозакрытие сессии

Если гость не нажал 'Я оплатил' — сессия закрывается автоматически через **20 минут** после перехода в `bill_requested`. Поле `auto_closed=true`.

**Механизм реализации — APScheduler внутри FastAPI:**

```python
# backend/app/core/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', minutes=5)
async def auto_close_stale_sessions():
    """Закрывает сессии в статусе bill_requested старше 20 минут."""
    cutoff = datetime.utcnow() - timedelta(minutes=20)
    await db.execute(
        update(Session)
        .where(Session.status == 'bill_requested')
        .where(Session.updated_at < cutoff)
        .values(status='completed', completed_at=func.now(), auto_closed=True)
    )
```

Scheduler запускается при старте FastAPI (`app.on_event("startup")`) и останавливается при shutdown. Задача выполняется каждые 5 минут — максимальная задержка закрытия 25 минут от момента `bill_requested`.

### Результат сервиса

- Вызов персонала с rate limit защитой
- Процесс оплаты с двухшаговым подтверждением
- Негативные отзывы перехватываются до публичного пространства

---

## Сервис 10 — Staff App

> Push уведомления · Активные столы · Взятие вызова

### Что реализуется

Отдельная страница для сотрудников. Push уведомления, просмотр активных столов и заказов, механика взятия вызова.

### Таблица БД

#### `push_subscriptions`

| Поле | Тип | Constraint | Описание |
|------|-----|-----------|---------|
| id | UUID | PK | Уникальный идентификатор подписки |
| staff_member_id | UUID | FK, NOT NULL | Сотрудник которому принадлежит подписка |
| company_id | UUID | FK, NOT NULL | Денормализован |
| branch_id | UUID | FK, NOT NULL | Денормализован |
| endpoint | TEXT | NOT NULL | URL эндпоинта push-сервиса браузера |
| p256dh | TEXT | NOT NULL | Публичный ключ шифрования (base64url) |
| auth | TEXT | NOT NULL | Auth secret (base64url) |
| user_agent | VARCHAR(500) | NULLABLE | Браузер/устройство для диагностики |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Дата подписки |
| updated_at | TIMESTAMP | NOT NULL | Дата обновления |

> Один сотрудник может иметь несколько подписок (рабочий телефон + личный). При отправке push — рассылаем на все активные подписки сотрудника. Если push вернул 410 Gone — удаляем подписку из БД.

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| GET | `/api/v1/staff/push/vapid-key` | Public | Получить VAPID публичный ключ для подписки на push |
| POST | `/api/v1/staff/push/subscribe` | Staff | Сохранить push subscription объект браузера |
| GET | `/api/v1/staff/sessions/active` | Staff | Активные сессии всего филиала |
| GET | `/api/v1/staff/sessions/{id}` | Staff | Детали сессии: заказы, позиции, итого |
| GET | `/api/v1/staff/calls/active` | Staff | Активные вызовы филиала |
| PATCH | `/api/v1/staff/calls/{id}/take` | Staff | Взять вызов. Статус → `taken`. |
| PATCH | `/api/v1/staff/calls/{id}/resolve` | Staff | Закрыть вызов. Статус → `resolved`. |

> `GET /vapid-key` вызывается фронтендом **до** запроса разрешения на push. Без публичного ключа `PushManager.subscribe()` не работает. Эндпоинт публичный — ключ не секретный.

### Cascade Delete

При удалении `staff_members` запись — все связанные `push_subscriptions` удаляются автоматически через `ON DELETE CASCADE` на уровне FK. Дополнительной логики не требуется.

### Типы push уведомлений

| Событие | Текст push |
|---------|-----------|
| Новый заказ | 'Стол #5 — новый заказ: Кружка пива x2, Снеки x1 — 700р' |
| Вызов персонала | 'Стол #5 — вызов персонала' |
| Готов к оплате | 'Стол #5 — готов к оплате. Заказано через систему: 1 200р' |
| Негативный отзыв | 'Стол #5 — оценка 2/5. Есть комментарий.' (только Branch Admin и Owner) |

### Технические детали Browser Push

- Web Push API + VAPID ключи на сервере
- **iOS 16.4+** — работает только при добавлении на домашний экран. Инструкция при первом входе.
- **Android** — работает из браузера без добавления на домашний экран
- Push subscription сохраняется в БД

### Механика взятия вызова

Push пришёл всем сотрудникам филиала. Первый кто нажал 'Взять' — фиксируется в `staff_calls.taken_by`, статус → `taken`. У остальных вызов пропадает из активных. Двое не побегут к одному столу.

### Что видит сотрудник

- Список активных столов со статусом (active / bill_requested)
- На каждом столе — количество заказов и сумма через систему
- При открытии стола — полный список позиций: что заказано и в каком количестве
- Список активных вызовов с кнопкой 'Взять'
- Вносить свою часть заказа — **версия 1.1**

### Результат сервиса

- Сотрудники получают push на телефон при каждом событии
- Механика 'взять вызов' исключает дублирование
- Любой сотрудник может открыть стол и увидеть полную картину заказов

---

## Сервис 11 — Admin Panel: аналитика

> Выручка · Заказы · Пиковые часы · Дни

### Что реализуется

Аналитика ориентирована на бизнес-ценность — сколько дополнительной выручки принесла система. Это главный аргумент для продления подписки.

### API эндпоинты

| Метод | URL | Роль | Описание |
|-------|-----|------|---------|
| GET | `/api/v1/analytics/summary` | Branch Admin+ | Сводка: сессии, заказы, выручка, средний чек |
| GET | `/api/v1/analytics/by-hour` | Branch Admin+ | Распределение заказов по часам суток |
| GET | `/api/v1/analytics/by-day` | Branch Admin+ | Распределение по дням недели |
| GET | `/api/v1/analytics/reviews` | Branch Admin+ | Статистика отзывов: средняя оценка, динамика |
| GET | `/api/v1/analytics/sessions` | Branch Admin+ | Сессии: открытые гостем vs закрытые по таймауту |

### Метрики

| Метрика | Источник | Бизнес-ценность |
|---------|---------|----------------|
| Количество сессий за период | sessions | Показывает трафик через систему |
| Количество заказов | orders | Основной KPI активности гостей |
| Общая сумма доп. заказов | orders.total_amount | Прямой показатель выручки от системы |
| Средний чек через систему | AVG(total_amount) | Показывает средний дозаказ гостя |
| Пиковые часы | GROUP BY HOUR(created_at) | Помогает планировать персонал |
| Пиковые дни недели | GROUP BY DOW(created_at) | Помогает планировать закупки и смены |
| Средняя оценка заведения | AVG(reviews.rating) | Индикатор качества обслуживания |
| % сессий закрытых по таймауту | auto_closed=true / total | Сигнал о незавершённых оплатах |

### Доступ

- **Owner** — видит аналитику по всей сети, переключается между филиалами
- **Branch Admin** — видит аналитику только своего филиала

### Результат сервиса

- Owner и Branch Admin видят конкретные цифры — сколько принесла система
- Данные по часам и дням помогают планировать персонал и закупки

---

## Сервис 12 — Оптимизация и деплой

> Service Worker · CDN · Nginx · Масштабирование

### Frontend оптимизация

- **Service Worker** — кэширует оболочку PWA. Повторное открытие из кэша, не из сети
- **Code splitting** — Guest PWA, Staff App, Admin Panel — отдельные chunks
- **Lazy loading** — MenuCatalog, BillButton, ReviewScreen грузятся по необходимости
- **WebP изображения** — конвертируются при загрузке. Размер в 2-3 раза меньше JPEG
- **Lazy loading картинок** — загружаются по мере скролла

### Backend оптимизация

- **Asyncio везде** — все IO операции асинхронны
- **Connection pooling** — asyncpg с пулом соединений
- **Redis кэш** — runtime/init кэшируется 5 минут
- **API responses** — только необходимые поля в JSON
- **Индексы БД** — все FK поля индексированы

### Индексы PostgreSQL

| Таблица | Индекс | Причина |
|---------|--------|---------|
| companies | (email) UNIQUE | Логин |
| companies | (slug) UNIQUE | Роутинг runtime/init |
| locations | (slug) UNIQUE | Поиск локации по NFC slug |
| locations | (branch_id, is_active) | Активные места филиала |
| sessions | PARTIAL UNIQUE (location_id) WHERE status='active' | Защита от одновременного касания |
| sessions | (branch_id, status) | Активные сессии филиала |
| sessions | (status, updated_at) WHERE status='bill_requested' | Автозакрытие по таймауту |
| orders | (session_id) | Заказы в рамках сессии |
| staff_calls | (branch_id, status) | Активные вызовы филиала |
| staff_calls | (branch_id, call_type, status) | Фильтр по типу вызова |
| menu_items | (company_id, is_available) | Доступное меню для runtime/init |
| branch_menu_overrides | (branch_id, menu_item_id) UNIQUE | Стоп-лист: одна запись на пару |
| push_subscriptions | (staff_member_id) | Подписки сотрудника |
| push_subscriptions | (branch_id) | Рассылка всем сотрудникам филиала |
| staff_members | (invite_token) WHERE invite_token IS NOT NULL | Поиск по токену приглашения |
| reviews | (branch_id, created_at) | Аналитика отзывов за период |

### Nginx конфигурация

```nginx
server {
  listen 443 ssl;
  server_name app.domain.ru;

  location / {
    proxy_pass http://frontend:80;
    add_header Cache-Control 'no-cache';
  }

  location /api/ {
    proxy_pass http://backend:8000;
  }

  location /media/ {
    proxy_pass https://your-s3-bucket.url;
    expires 30d;
    add_header Cache-Control 'public, immutable';
  }
}
```

### Масштабирование

- **MVP** — 4 vCPU, 8 GB RAM, 40 GB SSD. PostgreSQL, Redis и FastAPI на одном сервере. Справляется с десятками тенантов.
- **При росте** — replicas FastAPI за nginx upstream, Redis Sentinel, PostgreSQL read replica

### Требование к заведению

Стабильный WiFi в зале — обязательное условие. Озвучивается при онбординге.

### Результат сервиса

- Guest PWA открывается менее чем за 1 секунду при повторных посещениях
- Система работает на дешёвом entry-level сервере
- Готова к горизонтальному масштабированию

---

# Часть III. Известные проблемы и решения

| Проблема | Решение | Сервис |
|---------|---------|--------|
| iOS Push требует добавления на домашний экран | Инструкция при первом входе в Staff App. iOS 16.4+ поддерживает. | 10 |
| Никто не взял вызов | Таймаут + повторный push через N минут. Визуальное выделение давних вызовов. | 09 |
| Гость закрыл браузер — потерял сессию | Привязка `session_id` к localStorage. Восстановление при повторном открытии. | 08 |
| Одновременное касание метки двумя людьми | PostgreSQL partial unique index `ON sessions (location_id) WHERE status='active'`. | 08 |
| Меню устарело в Redis кэше | Мгновенная инвалидация через `invalidate_branch_cache()` при каждом изменении. | 05, 07 |
| NFC метка не читается (металл, повреждение) | Рядом с меткой дублирующий QR. Фронтенд для QR — версия 1.1. | 04 |
| Слабый интернет в заведении | Требование к WiFi озвучивается при онбординге. | 12 |
| Branch Admin не настроил филиал | Owner видит статус настройки каждого филиала в своей панели. | 03 |
| Гость набрал заказ и ушёл не оплатив | Сессии с `auto_closed=true` — отдельная метрика в аналитике. | 09 |
| Access Token истёк за смену | Refresh Token (30 дней, httpOnly cookie) — автоматическое обновление без повторного входа. | 02 |
| Гость коснулся выключенного стола | `runtime/init` возвращает `{ active: false }`. PWA показывает "Место недоступно". | 04, 07 |
| push подписка устарела (410 Gone) | При отправке push с ответом 410 — автоудаление подписки из `push_subscriptions`. | 10 |
| Рост нагрузки | Stateless FastAPI, горизонтальное масштабирование. | 12 |

---

# Часть IV. Глоссарий

| Термин | Определение |
|--------|------------|
| **Tenant / Тенант** | Отдельная компания (B2B клиент). Данные изолированы от других тенантов. |
| **Branch** | Физический филиал или точка сети. `companies → branches → locations`. |
| **Location slug** | Криптографический UUIDv4, вшитый в NFC-метку. Публичный идентификатор стола в URL. |
| **Session** | Жизненный цикл одного гостя за столом: от касания NFC до закрытия после оплаты. |
| **call_type** | `staff_call` = вызов персонала \| `bill_request` = готов к оплате, нести терминал. |
| **is_bill_active** | Feature-флаг. Включает кнопку 'Готов к оплате'. Онлайн-оплата не используется. |
| **is_menu_active** | Feature-флаг. Включает цифровой каталог для заказов через систему. |
| **price_at_order** | Цена зафиксированная в момент заказа. Защита от изменения цены задним числом. |
| **name_at_order** | Название позиции зафиксированное в момент заказа. |
| **auto_closed** | Сессия закрытая по таймауту (20 мин после `bill_requested`), а не гостем вручную. |
| **Rate limit (429)** | Redis TTL 60 сек на `lock:call:{branch_id}:{location_id}`. Защита от спама кнопки вызова. |
| **Browser Push** | Web Push API через Service Worker. Бесплатно. Требует добавления PWA на домашний экран на iOS. |
| **taken_by** | `staff_member_id` сотрудника взявшего вызов. После взятия вызов пропадает у остальных. |
| **runtime/init** | Единственный HTTP-запрос при загрузке Guest PWA. Возвращает всю конфигурацию UI. |
| **Owner** | Роль владельца бренда. Видит всю сеть. Может не присутствовать физически. |
| **Branch Admin** | Роль управляющего точки. Основной контакт при внедрении. Видит только свой филиал. |
| **Staff** | Роль сотрудника. Только Staff App. Получает push, видит заказы, берёт вызовы. |
| **invite_token** | Одноразовый crypto-random токен (64 символа) для онбординга сотрудника. Действует 48 часов. |
| **role** | Роль сотрудника в `staff_members`: `branch_admin` или `staff`. Определяет доступ к разделам Admin Panel филиала. Передаётся в JWT payload. |
| **login** | Короткое уникальное имя сотрудника в рамках филиала. Устанавливается при онбординге. Используется для повторного входа вместе с PIN. |
| **pin_hash** | Хэш PIN-кода сотрудника (argon2id). Используется для повторного входа в Staff App. |
| **branch_menu_overrides** | Таблица стоп-листа. Переопределяет доступность позиции меню на уровне конкретного филиала. |
| **push_subscriptions** | Таблица Web Push подписок сотрудников. Один сотрудник может иметь несколько подписок. Удаляются каскадно при удалении сотрудника. |
| **partial unique index** | PostgreSQL индекс с условием WHERE. Используется для `sessions (location_id) WHERE status='active'`. |
| **VAPID** | Voluntary Application Server Identification. Пара ключей (публичный + приватный) для авторизации push-сервера. Генерируется один раз, хранится в `.env`. |
| **refresh_token** | Долгоживущий токен (30 дней, httpOnly cookie) для автоматического обновления access token. Исключает повторный вход за смену. |
| **invalidate_branch_cache** | Функция сброса Redis кэша `cache:init:{slug}` для всех локаций филиала. Вызывается при любом изменении меню или профиля компании. |
| **global-toggle** | Глобальное включение/выключение позиции меню Owner-ом для всей сети. В отличие от `toggle` (Branch Admin, только своя точка). |

---

*Tap2Go Platform | Design Document v1.2.0 | 2026 | Конфиденциально*
