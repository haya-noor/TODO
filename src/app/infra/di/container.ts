import "reflect-metadata";
import { container } from "tsyringe";
import { TOKENS, setupDI } from "./tokens";

/**
 * Dependency Injection Container Setup
 * Registers all dependencies for the application
 */

// Re-export container, tokens, and setup for convenience
export { container, TOKENS, setupDI };

/**
Register a repository implementation 
register a class as the provider for a given token. 
token: symbol,                                 // The DI key (e.g., TOKENS.UserRepository)
implementation: new (...args: any[]) => T      // The class to construct for that token


provides the actual implementation of the interface ( UserRepositoryImpl ) 
 */
export function registerRepository<T>
(token: symbol, 
 implementation: new (...args: any[]) => T) 
{
  container.register(token, { useClass: implementation });
}

/**
Register a workflow implementation, same as registerRepository 
 */
export function registerWorkflow<T>(token: symbol, implementation: new (...args: any[]) => T) {
  container.register(token, { useClass: implementation });
}

/**
 * Get a registered dependency from the container
 */
export function resolve<T>(token: symbol): T {
  return container.resolve<T>(token);
}

/*
 * example
 *
 * // tokens.ts
 * export const TOKENS = {
 *   UserRepository: Symbol("UserRepository"),
 *   UploadWorkflow: Symbol("UploadWorkflow"),
 * } as const;
 *
 * // somewhere at app startup (composition root):
 * registerRepository(TOKENS.UserRepository, UserRepositoryImpl);
 * registerWorkflow(TOKENS.UploadWorkflow, UploadWorkflowImpl);
 *
 * // later, to get an instance:
 * const repo = resolve<UserRepository>(TOKENS.UserRepository);
 *
 * // or, inside a class (preferred), let tsyringe inject it:
 * @injectable()
 * class UploadWorkflowImpl {
 *   constructor(@inject(TOKENS.UserRepository) private repo: UserRepository) {}
 * }
 */