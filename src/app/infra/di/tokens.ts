import "reflect-metadata";
import { registerRepository, registerWorkflow } from "./container";
import { TaskDrizzleRepository } from "../repository/task.repository.impl";
import { UserDrizzleRepository } from "../repository/user.repository.impl";
import { TaskWorkflow } from "../../application/task/task.workflows";
import { UserWorkflow } from "../../application/user/user.workflows";

/**
 * Dependency Injection Tokens
 * Defines symbols for dependency injection container
 * 
 * tokens are unique keys (symbols) that name a dependency without tying you to a 
 * specific class 
 * 
 * In typescript interfaces vanishes at runtime,You can't say "inject UserRepository(the interface)"
 * it doesn't exist at runtime. A Symbol does exist.
 * 
 * Tokens decouple code from concrete classes. Your workflow depends on "UserRepository,"
 *  not on UserRepositoryImpl.
 * 
 * helps: 
 * seperation of concerns ( at application layer we're using the interface ( UserRepository ) 
 * in the infrastructure layer we're using the implementation ( UserRepositoryImpl )
 * 
 */

export const TOKENS = {
  // Repository tokens
  USER_REPOSITORY: Symbol.for("USER_REPOSITORY"),
  TASK_REPOSITORY: Symbol.for("TASK_REPOSITORY"),
  
  // Workflow tokens
  USER_WORKFLOW: Symbol.for("USER_WORKFLOW"),
  TASK_WORKFLOW: Symbol.for("TASK_WORKFLOW"),
} as const;

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

