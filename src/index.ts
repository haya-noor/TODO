import { createServer } from "http"
import { UserWorkflow } from "./application/workflows/user.workflow.js"
import { TaskWorkflow } from "./application/workflows/task.workflow.js"
import { UserRepository } from "./infrastructure/repositories/user.repository.js"
import { TaskRepository } from "./infrastructure/repositories/task.repository.js"
import {
  createTaskRoute,
  updateTaskRoute,
  removeTaskRoute,
  fetchTaskRoute,
  createUserRoute,
  updateUserRoute,
  removeUserRoute,
  fetchUserRoute,
} from "./presentation/router.js"
import { TOKENS } from "./presentation/tokens.js"
import { authMiddleware } from "./presentation/middleware/auth.js"
import { mapErrorToHttp } from "./presentation/error-mapper.js"

// Dependency injection setup
const userRepository = new UserRepository()
const taskRepository = new TaskRepository()
const userWorkflow = new UserWorkflow(userRepository)
const taskWorkflow = new TaskWorkflow(taskRepository)

;(globalThis as any).__diContainer = {
  [TOKENS.USER_WORKFLOW]: userWorkflow,
  [TOKENS.TASK_WORKFLOW]: taskWorkflow,
}

// HTTP server
const server = createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    res.statusCode = 200
    res.end()
    return
  }

  const url = new URL(req.url || "/", `http://${req.headers.host}`)
  const method = req.method || "GET"
  const path = url.pathname

  // Route matching
  let route: any = null

  if (method === "POST" && path === "/tasks") {
    route = createTaskRoute
  } else if (method === "PUT" && path.startsWith("/tasks/")) {
    route = updateTaskRoute
  } else if (method === "DELETE" && path.startsWith("/tasks/")) {
    route = removeTaskRoute
  } else if (method === "GET" && path === "/tasks") {
    route = fetchTaskRoute
  } else if (method === "POST" && path === "/users") {
    route = createUserRoute
  } else if (method === "PUT" && path.startsWith("/users/")) {
    route = updateUserRoute
  } else if (method === "DELETE" && path.startsWith("/users/")) {
    route = removeUserRoute
  } else if (method === "GET" && path === "/users") {
    route = fetchUserRoute
  }

  if (route) {
    // Apply auth middleware
    authMiddleware(req, res, async () => {
      try {
        const context = (req as any).context || { user: { id: "default-user" } }
        const result = await route.execute(req, context)
        res.statusCode = result.statusCode
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify(result.body))
      } catch (error: any) {
        const httpError = mapErrorToHttp(error)
        res.statusCode = httpError.statusCode
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({ error: httpError.message }))
      }
    })
  } else {
    res.statusCode = 404
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify({ error: "Not found" }))
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

