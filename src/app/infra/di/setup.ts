import "reflect-metadata";
import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { registerRepository, registerWorkflow, registerRepositoryWithFactory } from "./container";
import { TaskDrizzleRepository } from "../repository/task.repository.impl";
import { UserDrizzleRepository } from "../repository/user.repository.impl";
import { TaskWorkflow } from "../../application/task/task.workflows";
import { UserWorkflow } from "../../application/user/user.workflows";
import { TOKENS } from "./tokens";

config();

/**
 * Create database connection for production
 */
function createDatabaseConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not found in environment variables");
  }

  const client = postgres(url, {
    max: 10,                      // Maximum number of connections in the pool 
    idle_timeout: 20,            // timeout for idle connections is 20 seconds
    connect_timeout: 10,         // timeout for connection is 10 seconds
  });
  
  return drizzle(client);
}

/**
 * Setup Dependency Injection Container
 * Registers all repositories and workflows
 * Call this function at application startup
 */
export function setupDI(): void {
  // Create database connection
  const db = createDatabaseConnection();

  // Register Repositories with factory functions to provide database instance
  registerRepositoryWithFactory(TOKENS.USER_REPOSITORY, () => new UserDrizzleRepository(db));
  registerRepositoryWithFactory(TOKENS.TASK_REPOSITORY, () => new TaskDrizzleRepository(db));

  // Register Workflows
  registerWorkflow(TOKENS.TASK_WORKFLOW, TaskWorkflow);
  registerWorkflow(TOKENS.USER_WORKFLOW, UserWorkflow);
}

/**
 * Setup Dependency Injection Container for tests
 * Registers workflows and repositories with factory functions to provide database instances
 * @param db - The database instance to use for repositories
 */
export function setupDITest(db: any): void {
  // Register Workflows (same as production setup)
  registerWorkflow(TOKENS.TASK_WORKFLOW, TaskWorkflow);
  registerWorkflow(TOKENS.USER_WORKFLOW, UserWorkflow);

  // Register Repositories with factory functions to provide database instance
  registerRepositoryWithFactory(TOKENS.USER_REPOSITORY, () => new UserDrizzleRepository(db));
  registerRepositoryWithFactory(TOKENS.TASK_REPOSITORY, () => new TaskDrizzleRepository(db));
}

