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

### Run Tests
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

## 📡 API Examples

### Create User (Public - No Auth)
```bash
curl -X POST http://localhost:3000/user/create \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "name": "Alice",
      "email": "alice@example.com",
      "password": "Secret#123"
    },
    "meta": []
  }'

# Response includes JWT token
{
  "json": {
    "success": true,
    "data": { "id": "...", "name": "Alice", "email": "alice@example.com" },
    "token": "eyJhbGciOiJub25lIi..."
  }
}
```

### Create Task (Protected - Requires JWT)
```bash
TOKEN="eyJhbGciOiJub25lIi..."
USER_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X POST http://localhost:3000/task/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "json": {
      "title": "Implement authentication",
      "description": "Add JWT-based auth with refresh tokens...",
      "status": "TODO",
      "assigneeId": "'$USER_ID'"
    },
    "meta": []
  }'
```

### Search Tasks
```bash
curl -X POST http://localhost:3000/task/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "json": {
      "page": 1,
      "limit": 10,
      "text": "authentication",
      "status": ["TODO", "IN_PROGRESS"]
    },
    "meta": []
  }'
```

## 🔐 Authentication Flow

1. **User Registration** → `/user/create` (public)
   - Creates user entity
   - Generates JWT token
   - Returns token in response

2. **Token Structure** (No signature for simplicity)
   ```json
   {
     "userId": "uuid",
     "role": "assignee|admin",
     "email": "user@example.com"
   }
   ```

3. **Protected Routes** → All other endpoints
   - Extract token from `Authorization: Bearer <token>`
   - Parse JWT payload
   - Enrich context with user info
   - Validate user exists

4. **Context Enrichment**
   ```typescript
   // Before middleware: BaseContext
   { headers: { authorization: "Bearer ..." } }
   
   // After middleware: AuthenticatedContext
   {
     headers: {...},
     user: { id: "...", role: "assignee", email: "..." }
   }
   ```



**Built with ❤️ using Clean Architecture, Effect-TS, and functional programming principles.**
