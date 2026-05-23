# 🚀 Tap2Go — NFC-first Ordering Platform

> **Лёгкая мультитенантная B2B SaaS-платформа** для заведений с высоким трафиком.  
> Гость касается NFC-метки → открывается меню → заказывает без ожидания персонала.

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)

---

## ✨ Ключевые особенности

| Фича | Описание |
|------|----------|
| **📱 Zero-Install** | Никаких приложений. Коснулся метки — мгновенно открылся браузер |
| **🍔 Revenue First** | Меню и заказы — ядро. Вызов персонала — дополнение |
| **🏢 Multi-Tenancy** | Company → Branch → Location. Полная изоляция данных |
| **🔔 Browser Push** | Уведомления сотрудников без SMS/Telegram — бесплатно |
| **⚡ Rate Limiting** | Защита от спама вызовами через Redis TTL |

---

## 🎯 Целевая аудитория

- 🎮 Лан-центры и ПК-клубы
- 🍷 Крафтовые пабы и кальянные
- 🎳 Антикафе, боулинг, бильярд

**Не наш сегмент:** фастфуд (нет посадки), дорогие рестораны (живое общение — часть опыта)

---

## 🏗 Архитектура

```
company (Владелец сети)
    └── branch (Точка: "Туман на Ленина")
            └── location (Стол/NFC-метка: "Стол #5")
```

- **Owner** — видит всю сеть, аналитика
- **Branch Admin** — настраивает точку: столы, меню, сотрудники
- **Staff** — получает push, видит заказы, берёт вызовы

---

## 🛠 Технологический стек

| Уровень | Технология |
|---------|-----------|
| **Backend** | FastAPI (async), SQLAlchemy 2.0, Pydantic v2 |
| **Database** | PostgreSQL 15+ (multitenant) |
| **Cache** | Redis (rate limiting, config cache) |
| **Frontend** | React + Vite (3 apps: /space/, /staff/, /admin/) |
| **Auth** | JWT + argon2id |
| **Push** | Browser Push API (PWA) |
| **Deploy** | Docker + Docker Compose |

---

## 🚀 Быстрый старт

### 1. Клонирование и окружение

```bash
git clone https://github.com/avelNet/Tap2Go.git
cd Tap2Go/backend

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Настройка .env

```bash
cp .env.example .env
# Отредактируй .env — укажи SECRET_KEY (минимум 32 символа)
```

### 3. Запуск

```bash
# Локально (требуется PostgreSQL и Redis)
uvicorn app.main:app --reload

# Или через Docker (всё поднимается автоматически)
docker-compose up -d
```

### 4. Проверка

```bash
curl http://localhost:8000/health
# {"status": "ok", "version": "0.1.0", "timestamp": "..."}
```

---

## 📋 Roadmap (12 сервисов)

| # | Сервис | Статус |
|---|--------|--------|
| 01 | **Инфраструктура** — FastAPI, PostgreSQL, Redis | ✅ Ready |
| 02 | Аутентификация — JWT, регистрация компании | 🔄 Next |
| 03 | Управление филиалами — CRUD, Branch Admin | ⏳ |
| 04 | Управление локациями — NFC-метки, UUID slug | ⏳ |
| 05 | Управление меню — каталог, стоп-лист | ⏳ |
| 06 | Управление сотрудниками — Staff App access | ⏳ |
| 07 | Guest PWA: инициализация — runtime/init | ⏳ |
| 08 | Guest PWA: сессии и заказы | ⏳ |
| 09 | Guest PWA: оплата и отзыв | ⏳ |
| 10 | Staff App — push, активные столы | ⏳ |
| 11 | Admin Panel — аналитика, выручка | ⏳ |
| 12 | Оптимизация и деплой | ⏳ |

---

## 💰 Монетизация

| Этап | Цена | Условия |
|------|------|---------|
| **Тестовый** | 1 000 ₽/мес | До 5 столов, NFC-метки включены |
| **Полный** | 5 000 ₽/мес | Безлимит, browser push бесплатно |

---
