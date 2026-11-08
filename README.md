# Hotel Reservation Management System

Java (Spring Boot) REST backend + React frontend, PostgreSQL database.

## Structure
- `backend/`  Spring Boot API (MVC: controller / service / repository / model)
- `frontend/` React (Vite) web app

## Run locally
1. PostgreSQL running, with database `hotel_db` and user `hotel_user`.
2. `backend/.env` (not committed) with `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
3. Backend:
   ```bash
   cd backend
   set -a; . ./.env; set +a
   mvn spring-boot:run          # http://localhost:8080
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev                  # http://localhost:5173 (proxies /api to the backend)
   ```

## Tests
```bash
cd backend && set -a; . ./.env; set +a; mvn test   # uses the separate hotel_test database
cd frontend && npm test
```

## Branches
- `main` stable
- `development` day-to-day work
