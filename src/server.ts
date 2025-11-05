
/* 
Main server entry point
Uses handler from router.ts
Uses createContext from context.ts
Creates HTTP server and connects it to oRPC handler
*/

import "reflect-metadata";
import { config } from "dotenv";
import { createServer } from "node:http";
import { handler } from "./router";
import { createContext } from "./context";
import { setupDI } from "./app/infra/di/setup";

config();
setupDI();

const server = createServer(async (req, res) => {
  try {
    console.log(`[${req.method}] ${req.url}`);
    
    // Create context synchronously - oRPC will read the body stream itself
    const context = createContext({ req, res });
    
    const result = await handler.handle(req, res, {
      context,
    });
    
    // If no route matched, send 404
    if (!result.matched) {
      console.log(`Route not matched for ${req.method} ${req.url}`);
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not found" }));
    } else {
      console.log(`Route matched for ${req.method} ${req.url}`);
    }
    // If matched, the handler already wrote the response
  } catch (error) {
    console.error("Server error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error)
      }));
    }
  }
});

server.listen(3000, () => {
  console.log("╔═══════════════════════════════════════╗");
  console.log("║   TODO API Server Started!        ║");
  console.log("╚═══════════════════════════════════════╝\n");
  console.log(" Server:    http://localhost:3000");
  console.log(" Auth:      JWT required (except /user/create)\n");
});


