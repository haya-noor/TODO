import "reflect-metadata";
import { registerRepository, registerWorkflow } from "./container";
import { TaskDrizzleRepository } from "../repository/task.repository.impl";
import { UserDrizzleRepository } from "../repository/user.repository.impl";
import { TaskWorkflow } from "../../application/task/task.workflows";
import { UserWorkflow } from "../../application/user/user.workflows";
import { TOKENS } from "./tokens";

/**
 * Setup Dependency Injection Container
 * Registers all repositories and workflows
 * Call this function at application startup
 */
export function setupDI(): void {
  // Register Repositories
  registerRepository(TOKENS.TASK_REPOSITORY, TaskDrizzleRepository);
  registerRepository(TOKENS.USER_REPOSITORY, UserDrizzleRepository);

  // Register Workflows
  registerWorkflow(TOKENS.TASK_WORKFLOW, TaskWorkflow);
  registerWorkflow(TOKENS.USER_WORKFLOW, UserWorkflow);
}

