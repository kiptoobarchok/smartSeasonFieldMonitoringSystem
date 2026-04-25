# SmartSeason Field Monitoring System

Monorepo for crop progress tracking across multiple fields.

## GitHub Repository
- Monorepo: https://github.com/your-username/smartseason-field-monitoring-system
- (Optional split repos)
  - Backend: https://github.com/your-username/smartseason-backend
  - Frontend: https://github.com/your-username/smartseason-frontend

## Live Deployment (Render)
- Frontend URL: https://YOUR-RENDER-FRONTEND.onrender.com
- API URL: https://YOUR-RENDER-BACKEND.onrender.com/api

> Replace placeholders with your actual Render service URLs.

## Monorepo Structure

```text
smartSeasonFieldMonitoringSystem/
├── backend/
│   ├── config/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── fields/
│   │   └── dashboard/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## Stack
- Backend: Django REST Framework + PostgreSQL + JWT auth
- Frontend: Next.js (TypeScript) + Tailwind CSS

## Core Features Implemented
1. **Authentication + Roles**
   - Roles: `admin` (Coordinator), `agent` (Field Agent)
   - JWT login via `/api/auth/token/` (accepts username or email)
2. **Field Management**
   - Admins can create/update/delete fields and assign to agents
3. **Workflow**
   - Agents submit field stage updates with notes
   - Admins monitor all field updates globally
4. **Computed Status Logic**
   - `Completed` if stage is Harvested
   - `At Risk` if not Harvested and latest update is older than 7 days
   - `Active` otherwise
5. **Dashboards**
   - Admin: all fields + status breakdown + recent updates
   - Agent: assigned fields + personal status breakdown + update form

---

## Backend Setup (Django + PostgreSQL)

### 1) Create and activate virtual environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2) Install dependencies
```bash
pip install -r requirements.txt
```

### 3) Start PostgreSQL (optional with Docker)
```bash
cd ..
docker compose up -d postgres
cd backend
```

### 4) Configure environment
```bash
cp .env.example .env
```

Set PostgreSQL values in `.env`.

### 5) Migrate and run
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver
```

### 6) Run unit tests (At Risk logic)
```bash
python manage.py test apps.fields.tests
```

### Troubleshooting: `POST /api/auth/token/` returns 401
If you see `Unauthorized: /api/auth/token/`:

1. Re-seed demo users to reset passwords and activate accounts:
```bash
python manage.py seed_demo
```

2. Use one of these credentials:
    - Admin username/email: `coordinator_demo` / `coordinator@smartseason.local`
    - Agent username/email: `agent_demo` / `agent@smartseason.local`
    - Password: `DemoPass123!`

3. Confirm request body uses `username` + `password` (JSON):
```json
{
   "username": "coordinator_demo",
   "password": "DemoPass123!"
}
```

4. If using Docker Postgres, ensure backend `.env` matches DB credentials and host (`localhost` outside Docker, service name when containerized).

---

## Frontend Setup (Next.js + Tailwind)

### 1) Install dependencies
```bash
cd frontend
npm install
```

### 2) Configure environment
```bash
cp .env.example .env.local
```

### 3) Run locally
```bash
npm run dev
```

Frontend default URL: `http://localhost:3000`

---

## Demo Credentials
Created by `python manage.py seed_demo`:

- Admin (Coordinator)
  - Username: `coordinator_demo`
  - Password: `DemoPass123!`
- Field Agent
  - Username: `agent_demo`
  - Password: `DemoPass123!`

---

## Key API Endpoints
- `POST /api/auth/token/` – JWT login
- `GET /api/auth/me/` – current user profile
- `GET /api/fields/` – list fields (scoped by role)
- `POST /api/fields/` – create field (admin only)
- `GET /api/field-updates/` – list updates
- `POST /api/field-updates/` – submit stage update + notes
- `GET /api/dashboard/overview/` – dashboard data by role

---

## Design Decisions
1. **Modular DRF Apps**
   - Clear separation: auth (`accounts`), core domain (`fields`), projections (`dashboard`).
2. **Custom User Model**
   - Role is embedded in user model for simple and explicit authorization checks.
3. **`FieldUpdate` as Event Log**
   - Keeps change history; `Field.current_stage` is derived from latest update write-through.
4. **Computed `status` Property**
   - Business logic is centralized at model level for consistency across APIs/views.
5. **Typed Frontend Interfaces**
   - `lib/types.ts` ensures stable API contracts and simple component composition.

## Assumptions
- One `Field` is assigned to one `Field Agent` at a time.
- `At Risk` uses last update timestamp, or `updated_at` if no updates exist.
- Admin can see all fields and updates.
- Agent can only update assigned fields.

## Render Deployment Guide

### 1) Deploy Backend (Django API)
- Create a **Web Service** from this repo.
- Root directory: `backend`
- Build command:
```bash
pip install -r requirements.txt && python manage.py migrate
```
- Start command:
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

Set environment variables in Render:
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=YOUR-RENDER-BACKEND.onrender.com`
- `CORS_ALLOWED_ORIGINS=https://YOUR-RENDER-FRONTEND.onrender.com`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

Use a Render PostgreSQL instance (or external PostgreSQL) and map the credentials above.

### 2) Deploy Frontend (Next.js)
- Create a **Web Service** from this repo.
- Root directory: `frontend`
- Build command:
```bash
npm install && npm run build
```
- Start command:
```bash
npm run start
```

Set environment variable:
- `NEXT_PUBLIC_API_BASE_URL=https://YOUR-RENDER-BACKEND.onrender.com/api`

### 3) Post-Deploy Checklist
- Run demo seed once on backend service shell:
```bash
python manage.py seed_demo
```
- Verify login and role redirects:
   - Admin: `/admin/dashboard`
   - Agent: `/agent/dashboard`
