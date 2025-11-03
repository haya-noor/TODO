# Test Suite

This directory contains all tests for the TODO project.

## Test Structure

```
tests/
├── domain.tests/          # Domain layer tests (unit tests)
│   ├── user.domain.tests/
│   └── task.domain.tests/
├── infra.tests/           # Infrastructure layer tests (integration tests)
│   ├── user.repository.impl.test.ts
│   └── task.repository.impl.test.ts
├── dbsetup/              # Database setup utilities
└── test.data.ts          # Test data generators
```

## Prerequisites

### For Infrastructure Tests

Infrastructure tests require a running PostgreSQL database. We use Docker to run test databases.

1. **Install Docker** (if not already installed)
   - Follow instructions at https://docs.docker.com/get-docker/

2. **Create `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Or manually create `.env` with:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/todo_db
   TEST_DATABASE_URL=postgresql://testuser:testpass@localhost:5433/todo_test_db
   ```

3. **Start PostgreSQL containers**:
   ```bash
   docker-compose up -d
   ```

4. **Verify containers are running**:
   ```bash
   docker ps
   ```
   You should see `todo_postgres_dev` and `todo_postgres_test` running.

5. **Check database health**:
   ```bash
   docker-compose ps
   ```
   Both containers should show "healthy" status.

## Running Tests

### All Tests
```bash
npm test
```

### Domain Tests (Unit Tests - No Database Required)
```bash
npm run test:domain

# Or specific domain tests:
mise run test:user-entity
mise run test:user-guards
mise run test:task-entity
mise run test:task-guards
```

### Infrastructure Tests (Integration Tests - Requires Database)
```bash
npm run test:infra

# Or specific infrastructure tests:
mise run test:user-repository
mise run test:task-repository
```

### Watch Mode
```bash
npm run test:watch
```

### With UI
```bash
npm run test:ui
```

### With Coverage
```bash
npm run test:coverage
```

## Troubleshooting

### Error: `connect ECONNREFUSED 127.0.0.1:5432` or `127.0.0.1:5433`

This means PostgreSQL is not running. Solutions:

1. **Start Docker containers**:
   ```bash
   docker-compose up -d
   ```

2. **Check if containers are running**:
   ```bash
   docker ps | grep todo_postgres
   ```

3. **View container logs**:
   ```bash
   docker-compose logs postgres_test
   ```

4. **Restart containers**:
   ```bash
   docker-compose restart
   ```

### Error: `TEST_DATABASE_URL not found in environment variables`

Create a `.env` file in the project root with the required environment variables (see Prerequisites above).

### Port Already in Use

If ports 5432 or 5433 are already in use:

1. **Check what's using the port**:
   ```bash
   sudo lsof -i :5432
   sudo lsof -i :5433
   ```

2. **Stop existing PostgreSQL**:
   ```bash
   sudo systemctl stop postgresql
   ```

3. **Or change ports** in `docker-compose.yml` and `.env`

### Clean Up and Reset

To completely reset the test database:

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Database Management

### Connect to Test Database
```bash
docker exec -it todo_postgres_test psql -U testuser -d todo_test_db
```

### Connect to Dev Database
```bash
docker exec -it todo_postgres_dev psql -U user -d todo_db
```

### View All Tables
```sql
\dt
```

### View Table Schema
```sql
\d users
\d tasks
```

## Test Data

Test data is generated using:
- `@faker-js/faker` for realistic fake data
- `fast-check` for property-based testing
- Custom `TestDataGenerator` in `test.data.ts`

## Notes

- **Domain tests** are pure unit tests and don't require a database
- **Infrastructure tests** are integration tests that use a real PostgreSQL database
- The test database is isolated from the development database
- Each test suite cleans up after itself
- Migrations are applied automatically before tests run

