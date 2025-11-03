# TODO Project

A TODO application built with Effect-TS, Schema, and Drizzle ORM following a clean architecture pattern.

## Project Structure

```
src/
├── domain/           # Domain Layer: Entities and Schemas
├── application/      # Application Layer: Workflows and DTOs
├── infrastructure/   # Infrastructure Layer: DB and Repositories
└── presentation/     # Presentation Layer: Routes, Middleware, Error Mapping
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database connection string
```

3. Run database migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

4. Start the server:
```bash
npm run dev
```

## Architecture

The project follows a layered architecture:

- **Domain Layer**: Entities (User, Task) and Schemas
- **Application Layer**: Workflows for business logic, DTOs for input/output
- **Infrastructure Layer**: Drizzle ORM connection and Repositories
- **Presentation Layer**: HTTP routes with middleware/authentication

All errors are mapped to HTTP status codes (200, 404, etc.).

