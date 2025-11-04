import { os } from "@orpc/server";
import { resolve, TOKENS } from "../app/infra/di/container";
import { UserWorkflow } from "../app/application/user/user.workflows";
import { validateUser, type BaseContext, type AuthenticatedContext } from "./auth";
import { withActor, executeEffect, serializeEntity, toStandard } from "./route.utils";
import * as UserDTOs from "../app/application/user/user.dtos";

/**
 * User Routes
 * Implements CRUD operations for users using oRPC
 * 
 * Following CQRS (Command Query Responsibility Segregation):
 * - Commands: Operations that MODIFY state (create, update, delete) → use `command` variable
 * - Queries: Operations that READ state (fetch) → use `query` variable
 * 
 * Pattern from the architecture diagram:
 * - .$context() - Attach request context (user, session, etc.)
 * - .input() - Validate and parse input using DTO schema
 * - .output() - Validate response using DTO schema
 * - .use() - Middleware for authentication
 * - .handler() - Route handler that:
 *   1. Resolves workflow from DI container
 *   2. Enriches input with actor info (withActor)
 *   3. Executes workflow method
 *   4. Returns serialized response
 */

/**
 * Serialize user entity (remove password from response)
 * Uses the shared serializeEntity but adds user-specific logic to remove password
 * input: user: any - the user entity to serialize
 * output: userWithoutPassword: any - the user entity without the password field becasue
 * we don't want to send the password to the client in the response 
 */
const serializeUser = async (user: any) => {
  const serialized: any = await serializeEntity(user);
  const { password, ...userWithoutPassword } = serialized;
  return userWithoutPassword;
};

/*
create user route (COMMAND - modifies state)
   - .$context<BaseContext>() - Attach context (like user info etc.) from HTTP request headers
   - .input(toStandard(CreateUserDtoSchema)) - Validate input using DTO schema
   - .output(toStandard(UserResponseDtoSchema)) - Validate output using response DTO schema
   - .use(validateUser) - Middleware for authentication
   - .handler(async ({ input, context }) => {
     - const workflow = resolve<UserWorkflow>(TOKENS.USER_WORKFLOW) - Get UserWorkflow from DI container
     - const command = withActor(input, context) - Enrich input with actor info (user ID, role)
     - const result = await executeEffect(workflow.createUser(command)) - Execute the workflow
     - return { success: true, data: await serializeUser(result) } - Return serialized result
   })
*/
export const create = os
  .$context<BaseContext>()
  .input(toStandard(UserDTOs.CreateUserDtoSchema))
  .output(toStandard(UserDTOs.UserResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }) => {
    // Get the UserWorkflow instance from the dependency injection container
    const workflow = resolve<UserWorkflow>(TOKENS.USER_WORKFLOW);
    
    // Enrich input with actor info (e.g., user ID, email etc) using the context
    const command = withActor(input, context);
    
    // Execute the workflow
    const result = await executeEffect(workflow.createUser(command));
    
    return {
      success: true,
      data: await serializeUser(result),
    };
  });

// COMMAND: Update existing user
export const update = os
  .$context<BaseContext>()
  .input(toStandard(UserDTOs.UpdateUserDtoSchema))
  .output(toStandard(UserDTOs.UserResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }) => {
    const workflow = resolve<UserWorkflow>(TOKENS.USER_WORKFLOW);
    const command = withActor(input, context); // COMMAND - modifies state
    const result = await executeEffect(workflow.updateUser(command));
    
    return {
      success: true,
      data: await serializeUser(result),
    };
  });

// COMMAND: Delete user
export const remove = os
  .$context<BaseContext>()
  .input(toStandard(UserDTOs.RemoveUserDtoSchema))
  .output(toStandard(UserDTOs.UserRemoveResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }) => {
    const workflow = resolve<UserWorkflow>(TOKENS.USER_WORKFLOW);
    const command = withActor(input, context); // COMMAND - modifies state
    await executeEffect(workflow.deleteUserById(command));
    
    return {
      success: true,
      id: (input as any).id,
    };
  });

// QUERY: Fetch users with pagination
export const fetch = os
  .$context<BaseContext>()
  .input(toStandard(UserDTOs.UsersPaginationDtoSchema))
  .output(toStandard(UserDTOs.UsersListResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }) => {
    const workflow = resolve<UserWorkflow>(TOKENS.USER_WORKFLOW);
    const query = withActor(input, context); // QUERY - reads state
    const result = await executeEffect(workflow.getUsersPaginated(query));
    
    const serializedUsers = await Promise.all(
      result.data.map((user: any) => serializeUser(user))
    );
    
    return {
      data: serializedUsers,
      pagination: result.pagination,
    };
  });

