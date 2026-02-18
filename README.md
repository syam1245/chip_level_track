# chip_level_track

## Secure RBAC Authentication Overview

### 1) Architecture Overview
- **Frontend (React + MUI)**
  - `AuthProvider` loads the current session from `/api/auth/session`.
  - `ProtectedRoute` blocks unauthenticated navigation (including direct URL access).
  - Role-aware rendering hides admin-only UI (backup + delete actions) for Normal Users.
- **Backend (Express + MongoDB)**
  - `attachAuth` middleware validates signed auth cookie on every request.
  - `requireAuth` enforces authentication.
  - `requirePermission` enforces role permissions server-side.
  - `requireCsrf` validates CSRF token for all state-changing endpoints.
- **Security Layers**
  - Helmet, strict CORS, payload sanitization, API rate limiting.
  - Login-specific brute force limiter.
  - Passwords are hashed with PBKDF2, verified with timing-safe comparisons.

### 2) Data / Schema Changes
- No database schema changes were required.
- Users are predefined in server config (exactly two accounts):
  - `admin` (Admin role)
  - `user` (Normal User role)
- Passwords are never stored in plaintext in code or database; they are derived from environment secrets and hashed in memory.

### 3) Authentication Flow
1. User submits credentials to `POST /api/auth/login`.
2. Server validates username against predefined users, verifies hashed password, and generates:
   - Signed auth token cookie (`chip_auth`, HttpOnly, SameSite=Strict)
   - CSRF token cookie (`chip_csrf`) + token in payload
3. Frontend calls protected APIs with `credentials: include` and sends `x-csrf-token` for non-GET requests.
4. Backend validates auth token, then role permission, then CSRF token before write operations.
5. Logout clears both cookies via `POST /api/auth/logout`.

### 4) Role-Based Access Middleware Logic
- `requirePermission("items:create")`: Admin + Normal User
- `requirePermission("items:read")`: Admin + Normal User
- `requirePermission("items:update")`: Admin + Normal User
- `requirePermission("items:delete")`: Admin only
- `requirePermission("items:backup")`: Admin only

### 5) Implementation Notes (Frontend + Backend)
- Registration routes are intentionally absent.
- Login/session/logout endpoints are isolated under `/api/auth`.
- Items router is protected by chained middleware: `requireAuth` + `requireCsrf` + `requirePermission`.
- Frontend hides unauthorized actions entirely and enforces protected routes.

### 6) Security Checklist
- [x] No self-registration endpoint.
- [x] Exactly two predefined accounts.
- [x] Password hashing (PBKDF2) and timing-safe verification.
- [x] Signed auth cookies (HttpOnly, SameSite=Strict, secure in production).
- [x] CSRF protection for all mutating endpoints.
- [x] Backend role checks for every protected operation.
- [x] Frontend role-aware rendering for UX hardening.
- [x] Brute-force rate limiting on login.
- [x] Helmet/CORS/input sanitization enabled.

### 7) Testing Strategy
- **Unit Tests**
  - Password hashing and verification.
  - Token signing, validation, and expiration behavior.
  - Role permission middleware allow/deny behavior.
- **Integration Tests (recommended next step)**
  - Login + session + logout cookie lifecycle.
  - CRUD endpoint authorization matrix (Admin vs Normal User).
  - CSRF rejection on missing/invalid token for POST/PUT/DELETE.

## Required Environment Variables
Set these for the server:

```bash
AUTH_TOKEN_SECRET=replace-with-long-random-secret
ADMIN_PASSWORD=replace-with-admin-password
NORMAL_USER_PASSWORD=replace-with-normal-user-password
```

## Local Run

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```
