# Workspace Rules - PartoCare System

## 👤 Project Administration & Roles
- **Super Administrator:** The user **`tadiaemekson@gmail.com`** is the project's Super Admin (`SYSTEM_ADMIN`).
  - This user has global rights to register new hospitals and health facilities.
- **Worker Management:** Individual hospitals/facilities can onboard their own levels of workers (Midwives, Nurses, Physicians, Gynecologists, Managers).
  - Use the custom Artisan command **`php artisan user:create`** to register and configure new clinical personnel.

## ⚙️ Backend Connectivity
- The production backend is located at `https://partocare-production-vwfatb.laravel.cloud`.
- The frontend base URL config is centralized in `frontend/src/services/config.ts`.
- Always verify that CORS policies in `backend/config/cors.php` allow requests from the frontend domain (`https://partocare.vercel.app`).
