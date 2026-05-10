# B2B Project Management SaaS

This repository contains a full-stack project management SaaS for B2B use.

- **Frontend**: React admin dashboard using CoreUI in `frontend/`
- **Backend**: Laravel 11 API with Sanctum authentication in `backend/`

## Repository Structure

- `frontend/` - React frontend source code
- `backend/` - Laravel backend source code

## Running Locally

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Visit:

```text
http://localhost:3000
```

The frontend sends authenticated API requests to the backend over `/api/*`.
