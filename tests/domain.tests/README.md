# Domain Layer Tests

test-helpers.ts - Shared test utilities, data generators, and fast-check arbitraries
user.entity.test.ts - User entity tests (creation, updates, serialization, validation)
task.entity.test.ts - Task entity tests (creation, updates, serialization, validation)
user.guards.test.ts - User validation rules tests
task.guards.test.ts - Task validation rules tests
integration.test.ts - Integration tests for User and Task interactions

Commands: 
### Domain layer tests 
mise run test:user-entity
mise run test:user-guards
mise run test:task-entity
mise run test:task-guards
mise run test:integration

mise run dev           # Start dev server
mise run build          # Build project 

# For main database
npm run db:migrate
npm run db:generate


### Infra layer tests 
mise run test:user-repository
mise run test:task-repository



# using 
npm (node package manager)
Evidence:
package-lock.json exists in your project
.mise.toml uses npm run dev and npm run build commands


node.js 
Where: Runtime environment
Evidence: .mise.toml specifies node = "20"