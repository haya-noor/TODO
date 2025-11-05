import "reflect-metadata";
import { config } from "dotenv";
import { createServer } from "node:http";
import { RPCHandler } from "@orpc/server/node";
import { os } from "@orpc/server";
import { setupDI } from "./app/infra/di/setup";
import * as UserRoutes from "./presentation/user.routes";
import * as TaskRoutes from "./presentation/task.routes";

import { createServer } from "http";
import { handler } from "./router"; // <-- orrpc router
import { createContext } from "./context"; // <-- custom ctx

const server = createServer(async (req, res) => {
  const result = await handler.handle(req, res, {
    context: async () => createContext({ req, res }),
  });

  if (result) {
    res.statusCode = result.status;
    for (const [key, value] of Object.entries(result.headers ?? {})) {
      res.setHeader(key, value);
    }
    res.end(result.body);
  }
});

server.listen(3000, () => {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║   TODO API Server Started!        ║");
  console.log("╚═══════════════════════════════════════╝\n");
  console.log(" Server:    http://localhost:3000");
  console.log(" Auth:      JWT required (except /user/create)\n");
});


/*
// Load environment variables from .env file
config();

// Load environment variables
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Initialize DI container
console.log("Initializing DI container...");
setupDI();
console.log("DI container ready\n");

// Create router with all routes
const router = os.router({
  user: {
    create: UserRoutes.create,
    update: UserRoutes.update,
    fetch: UserRoutes.fetch,
    remove: UserRoutes.remove,
  },
  task: {
    create: TaskRoutes.create,
    update: TaskRoutes.update,
    remove: TaskRoutes.remove,
    fetch: TaskRoutes.fetch,
    getById: TaskRoutes.getById,
    getAll: TaskRoutes.getAll,
    search: TaskRoutes.search,
  },
} as any);

// Create RPC handler
const handler = new RPCHandler(router as any);

// Create HTTP server  
const server = createServer((req, res) => {
  // Ensure originalUrl is set for oRPC routing
  const reqWithUrl = req as typeof req & { originalUrl?: string };
  if (!reqWithUrl.originalUrl) {
    reqWithUrl.originalUrl = req.url || '/';
  }
  
  // Manually read and buffer the request body for oRPC
  // This ensures the stream is consumed correctly
  const chunks: Buffer[] = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const body = chunks.length > 0 ? Buffer.concat(chunks).toString() : '';
    
    console.log('Body received:', body ? `${body.substring(0, 100)}...` : 'EMPTY');
    console.log('Chunks count:', chunks.length);
    
    // Set the body so oRPC's toStandardBody can use it directly
    // toStandardBody checks: if (req.body !== void 0) return Promise.resolve(req.body)
    // So we need to set it to the string value (not undefined)
    // Then oRPC will call parseEmptyableJSON on it
    (req as any).body = body;
    
    // Handle request
    handler.handle(req, res, {
      context: { headers: req.headers },
    }).catch((error) => {
      console.error("Server error:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    });
  });
  
  req.on('error', (error) => {
    console.error("Request error:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Request error" }));
    }
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║   TODO API Server Started!        ║");
  console.log("╚═══════════════════════════════════════╝\n");
  console.log(` Server:    http://localhost:${PORT}`);
  console.log(` Auth:      JWT required (except /user/create)`);
  console.log("\nPress Ctrl+C to stop\n");
});

// Graceful shutdown
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
*/