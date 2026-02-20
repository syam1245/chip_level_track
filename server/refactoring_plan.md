# Refactoring Plan: Scalable & Layered Server Architecture

Transfrom the existing MERN backend into a production-grade, modular system following enterprise standards.

## 1. Directory Structure

```text
server/src/
├── core/                   # Infrastructure & Utilities
│   ├── config/             # Config management
│   ├── constants/          # Application-wide constants
│   ├── errors/             # Custom error classes
│   ├── middlewares/        # Global middlewares
│   ├── utils/              # Generic utilities (logger, etc.)
│   └── response/           # Consistent response structure
├── modules/                # Feature modules
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.routes.js
│   │   ├── auth.service.js
│   │   ├── auth.repository.js
│   │   ├── auth.validator.js
│   │   └── models/
│   ├── items/
│   │   ├── items.controller.js
│   │   ├── items.routes.js
│   │   ├── items.service.js
│   │   ├── items.repository.js
│   │   ├── items.validator.js
│   │   └── models/
│   └── vision/
│       ├── vision.controller.js
│       ├── vision.routes.js
│       ├── vision.service.js
│       └── vision.validator.js
├── app.js                  # Express app setup
└── server.js               # Entry point & server lifecycle
```

## 2. Infrastructure Setup (Core)

- **Config**: Centralize environment variables.
- **Logger**: Implement Winston or Pino abstraction.
- **Errors**: `AppError` class for operational errors.
- **Middlewares**: `asyncHandler` to remove try-catch blocks from controllers.
- **Responses**: Standardized JSON response format.

## 3. Module Refactoring (Step-by-Step)

### A. Items Module
1. Create `ItemRepository` for DB access logic.
2. Create `ItemService` for business logic (e.g., status history updates).
3. Create `ItemController` for HTTP handling.
4. Create `ItemValidator` using Joi or Zod (Zod is already used in vision).
5. Define routes in `items.routes.js`.

### B. Auth Module
1. Refactor auth helpers (password/token) into service/util.
2. Separate session management.
3. Decouple role-based permissions into specialized middleware.

### C. Vision Module
1. Move Gemini logic to `VisionService`.
2. Move Zod validation to `VisionValidator`.

## 4. Integration & Testing

1. Update `app.js` to use centralized routing.
2. Ensure graceful shutdown and DB connection handling in `server.js`.
3. Verify all existing endpoints work without changes to the API contract.

## 5. Cleanup

- Remove legacy logic from `routes/`, `config/`, etc.
- Move models to respective modules.
