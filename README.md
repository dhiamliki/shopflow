# ShopFlow Submission

## Prerequisites
- Java 21+
- Node.js 20+ and npm
- PostgreSQL 15+ (for `dev` and `prod` profiles)

## Database Setup
1. Create database and user in PostgreSQL:
   ```sql
   CREATE DATABASE shopflow;
   CREATE USER shopflow WITH PASSWORD 'shopflow';
   GRANT ALL PRIVILEGES ON DATABASE shopflow TO shopflow;
   ```
2. Optional environment overrides:
   - `SHOPFLOW_DB_URL`
   - `SHOPFLOW_DB_USERNAME`
   - `SHOPFLOW_DB_PASSWORD`
3. JWT secret (optional override):
   - `SHOPFLOW_JWT_SECRET`

## Backend Launch
From `backend/`:
```bash
./mvnw test
./mvnw spring-boot:run
```
Windows:
```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Default backend URL: `http://localhost:9090`

## Frontend Launch
From `frontend/`:
```bash
npm install
npm run start
```

Production build:
```bash
npm run build
```

## Swagger URL
- `http://localhost:9090/swagger-ui`

## Postman Collection Usage
- Import root file: `shopflow.postman_collection.json`
- Set base URL variable to `http://localhost:9090`
- Authenticate first (`/api/auth/login`), then reuse token for protected routes.

## Demo Accounts
- Admin: `admin@shopflow.com` / `Admin123!`
- Seller: `seller1@shopflow.com` / `Seller123!`
- Customer: `customer1@shopflow.com` / `Customer123!`

Notes:
- Password reset endpoints are available:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- In demo mode without email service, forgot-password returns the reset token in API response.
