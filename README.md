# TODO App - Clean Architecture with Effect-TS

A production-ready TODO application demonstrating **Clean Architecture** principles with **Effect-TS**, **Domain-Driven Design**, and **functional programming** in TypeScript.

## 🎯 Project Focus

This project showcases:

- **Clean Architecture** with strict layer separation (Domain → Application → Infrastructure → Presentation)
- **Effect-TS** for functional error handling and composition
- **Domain-Driven Design** with rich domain entities and value objects
- **Type-safe branded types** using Effect's Brand system
- **Property-based testing** with fast-check
- **oRPC** for type-safe RPC-style API endpoints
- **Drizzle ORM** for database operations
- **JWT-based authentication** with middleware

## 📁 Project Structure

```
src/
├── app/
│   ├── domain/              # Business logic & entities (Pure TypeScript)
│   │   ├── brand/          # Branded types (UUID, Email, DateTime)
│   │   ├── user/           # User entity, guards, errors
│   │   ├── task/           # Task entity, guards, errors
│   │   └── utils/          # Base entity, repository interfaces
│   │
│   ├── application/         # Use cases & workflows (Effect-TS)
│   │   ├── user/           # User DTOs & workflows
│   │   └── task/           # Task DTOs & workflows
│   │
│   └── infra/              # External concerns (Database, DI)
│       ├── db/             # Drizzle schema definitions
│       ├── di/             # Dependency injection (tsyringe)
│       └── repository/     # Repository implementations
│
├── presentation/            # HTTP layer (oRPC routes)
│   ├── auth/               # JWT middleware & helpers
│   └── orpc-routes/        # Route handlers (user, task)
│
├── context.ts              # Context creation from HTTP requests
├── router.ts               # oRPC router setup
└── server.ts               # HTTP server entry point

tests/
├── domain.tests/           # Entity & guard tests
├── application.tests/      # Workflow & DTO tests
├── infra.tests/           # Repository integration tests
└── presentation.tests/     # End-to-end API tests
```

## 🏗️ Architecture Layers

### 1. **Domain Layer** (Core Business Logic)

The innermost layer with zero external dependencies.

**Key Components:**
- **Entities**: `User`, `Task` - Rich domain models with behavior
- **Value Objects**: Branded types (`UUID`, `Email`, `DateTime`, `UserId`, `TaskId`)
- **Guards**: Validation rules (`UserGuards`, `TaskGuards`)
- **Errors**: Domain-specific errors (`UserValidationError`, `TaskNotFoundError`)
- **Repositories**: Abstract interfaces defining data operations
  

### 2. **Application Layer** (Use Cases)

Orchestrates domain entities to fulfill business workflows.

**Key Components:**
- **DTOs**: Input/output schemas with Effect Schema validation
- **Workflows**: Pure functions using Effect for composition
- **Workflow Classes**: Injectable classes wrapping workflows for DI


### 3. **Infrastructure Layer** 

Implements repositories.

**Key Components:**
- **Repository Implementations**: Drizzle-based data access
- **Database Schema**: Drizzle table definitions
- **Dependency Injection**: tsyringe container setup


### 4. **Presentation Layer** (HTTP API)

Exposes the application via type-safe RPC endpoints.

**Key Components:**
- **oRPC Routes**: Type-safe route handlers
- **Auth Middleware**: JWT validation
- **Route Utilities**: Request/response transformation


## 🔄 Request Flow

```
HTTP Request
    ↓
[Server] → Creates BaseContext from headers
    ↓
[oRPC Handler] → Routes request to procedure
    ↓
[Auth Middleware] → Validates JWT, enriches context with user
    ↓
[Route Handler] → Validates input via Effect Schema
    ↓
[Workflow] → Orchestrates domain entities
    ↓
[Repository] → Persists/retrieves from database
    ↓
[Domain Entity] → Business logic validation
    ↓
[Route Handler] → Serializes response
    ↓
HTTP Response
```

## 🛠️ Tech Stack

### Core
- **TypeScript 5.7** - Type safety
- **Effect-TS** - Functional error handling, schemas, and composition
- **Node.js** - Runtime

### API Layer
- **oRPC** - Type-safe RPC framework
- **JWT** - Authentication tokens

### Database
- **PostgreSQL** - Production database
- **Drizzle ORM** - Type-safe SQL query builder
- **postgres** - PostgreSQL client

### Dependency Injection
- **tsyringe** - IoC container with decorators
- **reflect-metadata** - Decorator metadata support

### Testing
- **Vitest** - Fast unit test runner
- **fast-check** - Property-based testing
- **@faker-js/faker** - Realistic test data generation

## 🚀 Getting Started

### Prerequisites
```bash
# Node.js 20+
node --version

# PostgreSQL running (Docker recommended)
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=todo_db \
  -p 5432:5432 \
  postgres:16
```

### Installation
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### Database Setup
```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit push

# Verify database
npm run db:check
```

### Run Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

## 🧪 Testing

### Test Structure
```
tests/
├── domain.tests/           # Pure domain logic (no DB)
│   ├── user.entity.test.ts
│   ├── user.guards.test.ts
│   ├── task.entity.test.ts
│   └── integration.test.ts
│
├── application.tests/      # Workflow tests (mocked repos)
│   ├── user.workflows.test.ts
│   └── task.workflows.test.ts
│
├── infra.tests/           # Repository tests (real DB)
│   ├── user.repository.impl.test.ts
│   └── task.repository.impl.test.ts
│
└── presentation.tests/     # E2E API tests (real DB + server)
    ├── user.test/
    └── task.test/
```

---

### Running Automated Tests (Domain, Application, Infrastructure)

```bash
# Domain tests 
mise run test:user-entity
mise run test:user-guards
mise run test:task-entity
mise run test:task-guards
mise run test:integration

# Infrastructure tests 
mise run test:user-repository
mise run test:task-repository

# Application tests 
mise run test:task-dtos
mise run test:task-workflows
mise run test:user-dtos
mise run test:user-workflows
```

---

## 🧪 Manual Contract Testing (Postman)

Alongside automated testing, all API endpoints were fully validated through **manual contract testing using Postman**.
Each endpoint was executed with real request/response bodies to confirm:

* oRPC route definitions match the actual HTTP behavior
* Effect Schema validation enforces proper input rules
* JWT authentication & authorization work end-to-end
* Admin vs User role logic behaves correctly
* Task & User workflows operate as designed
* Pagination, search, and filtering produce correct results

These tests ensure complete **end-to-end reliability** across the Presentation → Application → Domain → Infrastructure layers.

---

### 📌 Postman Environment Setup

A dedicated Postman environment was used to store reusable variables:

| Variable        | Purpose                                  |
| --------------- | ---------------------------------------- |
| `baseUrl`       | API root (e.g., `http://localhost:3000`) |
| `adminEmail`    | Admin creation email                     |
| `adminPass`     | Admin password                           |
| `assigneeEmail` | Standard user email                      |
| `assigneePass`  | Standard user password                   |
| `adminToken`    | JWT returned after admin login/creation  |
| `assigneeToken` | JWT returned after assignee login        |
| `adminId`       | UUID returned from admin creation        |
| `assigneeId`    | UUID returned from assignee creation     |
| `taskId`        | UUID of created task                     |
| `taskStatus`    | Used during search tests                 |
| `page`          | Pagination page                          |
| `limit`         | Pagination size                          |

These variables were automatically injected into request bodies using the Postman template syntax:

```
{{variableName}}
```

---

### 👤 User Endpoint Tests (Postman)

All User endpoints were manually verified:

* **POST** `/user/create` (Admin & Assignee)
* **POST** `/user/updateEmail`
* **POST** `/user/updateName`
* **POST** `/user/updatePassword`
* **POST** `/user/updateAllCredentials`
* **POST** `/user/delete`
* **POST** `/user/search` (paginated)

Example: **Create Admin**

```json
{
  "json": {
    "name": "Admin",
    "email": "{{adminEmail}}",
    "password": "{{adminPass}}",
    "roles": ["Admin"]
  }
}
```

Example: **Authorization header used for protected routes**

```bash
Authorization: Bearer {{adminToken}}
```

---

### 📝 Task Endpoint Tests (Postman)

All Task endpoints were validated:

* **POST** `/task/create`
* **POST** `/task/createMinimal`
* **POST** `/task/remove`
* **POST** `/task/get` (pagination)
* **POST** `/task/getAll`
* **POST** `/task/getById`
* **POST** `/task/update`
* **POST** `/task/search`
* **POST** `/task/searchFiltered`

Example: **Create Task**

```json
{
  "json": {
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication with refresh tokens.",
    "status": "TODO",
    "assigneeId": "{{assigneeId}}"
  },
  "meta": []
}
```

---

### ✔️ Contract Testing Result

All endpoints passed Postman validations:

* Request & response schemas matched oRPC definitions
* Input validation correctly rejected malformed data
* Authentication & role-based access control worked correctly
* Task creation, update, search, pagination, and deletion behaved as expected
* All CRUD flows executed without errors
* Tokens were generated, validated, and reused successfully


---



