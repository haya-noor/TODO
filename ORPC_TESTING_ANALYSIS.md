# oRPC Testing Format Analysis

## Overview
This document summarizes the findings from analyzing the `node_modules/@orpc` packages to understand the testing format that oRPC expects.

## Key Findings

### 1. Testing Methods Available in oRPC

Based on the oRPC documentation and codebase analysis, there are several ways to test oRPC procedures:

#### A. Direct Invocation Testing (`.callable()`)
oRPC procedures can be made callable using the `.callable()` method, which allows them to be invoked directly without HTTP overhead. This is ideal for unit testing individual procedures.

**Type Signature:**
```typescript
callable<TClientContext extends ClientContext>(
  ...rest: MaybeOptionalOptions<CreateProcedureClientOptions<TInitialContext, TOutputSchema, TErrorMap, TMeta, TClientContext>>
): DecoratedProcedure<...> & ProcedureClient<TClientContext, TInputSchema, TOutputSchema, TErrorMap>
```

**Usage Pattern:**
```typescript
// Make a procedure callable
const callableProcedure = myProcedure.callable({ 
  context: { /* your test context */ }
});

// Call it directly in tests
const result = await callableProcedure(input);
```

#### B. HTTP-Based Testing (supertest)
The `@orpc/server` package includes `supertest` in its devDependencies, indicating support for HTTP-based integration testing.

**Packages that use supertest:**
- `@orpc/server` (devDependencies: `supertest: ^7.1.4`)
- `@orpc/standard-server-node` (devDependencies: `supertest: ^7.1.4`)
- `@orpc/standard-server-fastify` (devDependencies: `supertest: ^7.1.4`)

#### C. Procedure Client Testing
Procedures can be tested using the `ProcedureClient` interface, which provides type-safe client functionality.

### 2. Current Project Setup

**Your Current Test Setup:**
- Testing framework: **Vitest** (`vitest: ^2.1.0`)
- Current tests: Unit tests for workflows using mocks
- Missing: Integration tests for oRPC routes/procedures

### 3. Recommended Testing Format for oRPC Routes

Based on the analysis, here are the recommended testing approaches:

#### Option 1: Using `.callable()` for Unit Testing Routes (Recommended)

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import * as TaskRoutes from "@/presentation/task.routes";
import { setupDI } from "@/app/infra/di/setup";

describe("Task Routes", () => {
  beforeEach(() => {
    setupDI(); // Initialize DI container
  });

  it("should create a task", async () => {
    // Make the route callable
    const callableCreate = TaskRoutes.create.callable({
      context: {
        headers: {},
        user: {
          id: "test-user-id",
          role: "assignee",
        },
      },
    });

    // Call directly
    const result = await callableCreate({
      title: "Test Task",
      description: "Test Description",
      status: "TODO",
      assigneeId: "test-user-id",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

#### Option 2: Using HTTP Testing with Supertest (Integration Testing)

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createServer } from "node:http";
import { RPCHandler } from "@orpc/server/node";
import { router } from "@/server"; // Your router

describe("Task Routes - HTTP Integration", () => {
  let app: any;
  
  beforeEach(() => {
    const handler = new RPCHandler(router as any);
    const server = createServer((req, res) => {
      handler.handle(req, res, {
        context: { headers: req.headers },
      });
    });
    app = server;
  });

  it("should create a task via HTTP", async () => {
    const response = await request(app)
      .post("/task/create")
      .set("Authorization", "Bearer valid-jwt-token")
      .send({
        title: "Test Task",
        description: "Test Description",
        status: "TODO",
        assigneeId: "test-user-id",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

#### Option 3: Testing with Context Mocking

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as TaskRoutes from "@/presentation/task.routes";

describe("Task Routes with Mocked Context", () => {
  it("should handle authentication", async () => {
    const mockContext = {
      headers: {
        authorization: "Bearer valid-token",
      },
      user: {
        id: "user-123",
        role: "assignee" as const,
      },
    };

    const callableRoute = TaskRoutes.create.callable({
      context: mockContext,
    });

    const result = await callableRoute({
      title: "Test",
      status: "TODO",
      assigneeId: "user-123",
    });

    expect(result).toBeDefined();
  });
});
```

### 4. Key Points for oRPC Testing

1. **Context is Required**: oRPC procedures that use `.$context()` require a context object when calling them
2. **Input/Output Validation**: oRPC automatically validates inputs and outputs based on the schemas defined
3. **Error Handling**: oRPC uses `ORPCError` for type-safe error handling
4. **Middleware Testing**: When testing routes with middleware (like `validateUser`), ensure the context includes all required fields
5. **Type Safety**: The `.callable()` method maintains full type safety, so TypeScript will catch type errors

### 5. Current Project Structure

Your routes are structured as:
```typescript
export const create = os
  .$context<BaseContext>()
  .input(toStandard(TaskDTOs.CreateTaskDtoSchema))
  .output(toStandard(TaskResponseDTOs.TaskResponseDtoSchema))
  .use(validateUser) // Middleware
  .handler(async ({ input, context }) => { ... });
```

**Testing Considerations:**
- Routes require `BaseContext` which includes `headers`
- Routes use `validateUser` middleware which requires `AuthenticatedContext`
- Routes use DI container (`resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW)`)
- Routes execute Effects that need to be awaited

### 6. Recommended Test Structure

For your project, create tests like:

```typescript
// tests/presentation/task.routes.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import * as TaskRoutes from "@/presentation/task.routes";
import { setupDI } from "@/app/infra/di/setup";
import type { AuthenticatedContext } from "@/presentation/auth/auth.middleware";

describe("Task Routes", () => {
  beforeEach(() => {
    setupDI();
  });

  describe("create", () => {
    it("should create a task with valid input", async () => {
      const context: AuthenticatedContext = {
        headers: {
          authorization: "Bearer test-token",
        },
        user: {
          id: "test-user-id",
          role: "assignee",
        },
      };

      const callableCreate = TaskRoutes.create.callable({ context });

      const result = await callableCreate({
        title: "Test Task",
        description: "Test Description",
        status: "TODO",
        assigneeId: "test-user-id",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBe("Test Task");
    });
  });
});
```

## Summary

**oRPC expects testing in this format:**
1. Use `.callable()` method to make procedures directly invocable
2. Provide the required context object (matching `.$context()` type)
3. Call the procedure with input matching the `.input()` schema
4. Assert on the output matching the `.output()` schema
5. Use Vitest (or your preferred test framework) for test structure
6. For integration testing, use HTTP-based testing with supertest

The key is that oRPC procedures can be made callable, allowing them to be tested directly without HTTP overhead while maintaining full type safety and validation.

