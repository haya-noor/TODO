// tests/orpc.setup.ts
import "reflect-metadata";
import { beforeAll, afterAll } from "vitest";
import { createServer } from "node:http";

// --- Use real router, handler, and context from server ---
import { handler } from "../../src/router";
import { createContext } from "../../src/context";

// --- Boot DI (repositories + workflows) ---
import { setupDITest } from "../../src/app/infra/di/setup";
export { TOKENS } from "../../src/app/infra/di/tokens";
// If you also export resolve() from your container, re-export it here:
export { resolve, container } from "../../src/app/infra/di/container";

// --- Database setup for tests ---
import { createConnection, closeConnection } from "../dbsetup/db.connection";
import { setupTestDatabase } from "../dbsetup/db.setup";

// --- route utils ---
export {toStandard,executeEffect,serializeEntity,withActor} from "../../src/presentation/orpc-routes/route.utils";

// --- auth middleware + context types ---
import type { BaseContext, AuthenticatedContext } from "../../src/presentation/auth/auth.middleware";
export {
  validateUser,
  type BaseContext,
  type AuthenticatedContext,
} from "../../src/presentation/auth/auth.middleware";

// Build a minimal BaseContext for tests (gets the context from the headers of the request)
export const makeCtx = (headers: Record<string, string> = {}): BaseContext => ({
  headers,
});

// Build a dummy Bearer token your auth middleware will accept.
// (Your jwt.helper.ts decodes payload; no signature verification needed.)
export const makeBearer = (payload?: Partial<{
  userId: string;
  id: string;
  role: "admin" | "assignee";
  email: string;
}>) => {
  const header = { alg: "none", typ: "JWT" };
  const body = {
    userId: "auth-user-id",
    role: "admin",
    email: "admin@example.com",
    ...payload,
  };
  // encode the header and body to base64url, required by JWT standard 
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `Bearer ${b64(header)}.${b64(body)}.sig`;
};

// Helper to invoke an oRPC procedure using the real router and handler
// Uses the real handler from router.ts and createContext from context.ts
export const callProc = async <I, O>(
  proc: any,
  input: I,
  context: BaseContext
): Promise<O> => {
  // Determine the path based on the procedure
  // Compare with actual route exports to find the path
  const UserRoutes = await import("../../src/presentation/orpc-routes/user.routes");
  const TaskRoutes = await import("../../src/presentation/orpc-routes/task.routes");
  
  let path = "";
  // oRPC router structure { user: { create: ... } } maps to /user/create
  // Try without /rpc prefix first
  if (proc === UserRoutes.create) path = "/user/create";
  else if (proc === UserRoutes.update) path = "/user/update";
  else if (proc === UserRoutes.fetch) path = "/user/fetch";
  else if (proc === UserRoutes.remove) path = "/user/remove";
  else if (proc === TaskRoutes.create) path = "/task/create";
  else if (proc === TaskRoutes.update) path = "/task/update";
  else if (proc === TaskRoutes.remove) path = "/task/remove";
  else if (proc === TaskRoutes.fetch) path = "/task/fetch";
  else if (proc === TaskRoutes.getById) path = "/task/getById";
  else if (proc === TaskRoutes.getAll) path = "/task/getAll";
  else if (proc === TaskRoutes.search) path = "/task/search";
  else {
    throw new Error(`Unknown procedure. Cannot determine path for procedure.`);
  }
  
  // Use a minimal HTTP server to create proper IncomingMessage objects
  // This ensures all stream methods work correctly with oRPC
  // ...
return new Promise<O>((resolve, reject) => {
  const testServer = createServer(async (req, res) => {
    try {
      // Do NOT read/parse the body yourself. Let oRPC consume the stream.
      const result = await handler.handle(req, res, {
        context: createContext({ req, res }),
      });

      // If no route matched, send 404
      if (!result.matched) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Not found" }));
      }
      // If matched, the handler already wrote the response
    } catch (error) {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        // Log the actual error for debugging
        console.error("Test server error:", error);
        if (error instanceof Error) {
          console.error("Error stack:", error.stack);
        }
        res.end(JSON.stringify({ 
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error)
        }));
      }
    }
  });

  testServer.listen(0, async () => {
    const port = (testServer.address() as any)?.port;
    if (!port) {
      testServer.close();
      reject(new Error("Could not get test server port"));
      return;
    }

    try {
      // oRPC Node expects the "json" transport envelope
      // Format: {"json": {...input fields...}} (not {"json": {"input": {...}}})
      const bodyString = JSON.stringify({ json: input });

      const response = await fetch(`http://localhost:${port}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...context.headers,
        },
        body: bodyString,
      });

      const responseBody = await response.text();
      
      // Close server after response
      testServer.close(() => {
        if (!response.ok) {
          reject(new Error(`HTTP ${response.status}: ${responseBody}`));
          return;
        }
        if (responseBody) {
          try {
            const parsed = JSON.parse(responseBody);
            // oRPC may return responses in { json: {...} } format
            // If the response has a 'json' property, use that; otherwise use the parsed response directly
            const result = parsed.json !== undefined ? parsed.json : parsed;
            resolve(result as O);
          } catch (parseError) {
            reject(new Error(`Failed to parse response: ${responseBody}`));
          }
        } else {
          reject(new Error("No response body from procedure"));
        }
      });
    } catch (error) {
      testServer.close();
      reject(error);
    }
  });

  testServer.on("error", (error) => {
    testServer.close();
    reject(error);
  });
});
};

// Database connection instance (will be created in beforeAll)
let dbConnection: { client: any; db: any } | null = null;

// Boot DI and database connection once for the test run
beforeAll(async () => {
  // Create database connection for tests
  // Try TEST_DATABASE_URL first, then fall back to DATABASE_URL
  const envVar = process.env.TEST_DATABASE_URL ? "TEST_DATABASE_URL" : "DATABASE_URL";
  
  // Create connection (will throw if env var not found)
  dbConnection = createConnection(envVar, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  // Setup database schema (create tables)
  await setupTestDatabase(dbConnection.db);
  
  // Setup DI for tests with database instance
  setupDITest(dbConnection.db);
});

// Cleanup: Close database connection after all tests
afterAll(async () => {
  if (dbConnection?.client) {
    await closeConnection(dbConnection.client);
  }
});
