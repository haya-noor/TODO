import { os } from "@orpc/server";
import { resolve, TOKENS } from "@infra/di/container";
import { UserWorkflow } from "@application/user/user.workflows";
import { validateUser, type BaseContext, type AuthenticatedContext } from "../auth/auth.middleware";
import { generateJWT } from "../auth/jwt.helper";
import { withActor, executeEffect, serializeEntity, toStandard } from "./route.utils";
import * as UserDTOs from "@application/user/user.dtos";
import * as UserResponseDTOs from "@application/user/user.response.dto";
import type { 
  UserResponseDto, 
  UsersListResponseDto, 
  UserRemoveResponseDto 
} from "@application/user/user.response.dto";

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
This is a PUBLIC endpoint - NO AUTHENTICATION REQUIRED
New users register here to create their account

   - .$context<BaseContext>() - Attach context from HTTP request headers
   - .input(toStandard(CreateUserDtoSchema)) - Validate input using DTO schema
   - .output(toStandard(UserResponseDtoSchema)) - Validate output using response DTO schema
   - NO .use(validateUser) - This is PUBLIC, no auth needed for registration
   - .handler(async ({ input }) => {
     - const workflow = resolve<UserWorkflow>(TOKENS.USER_WORKFLOW) - Get UserWorkflow from DI container
     - const result = await executeEffect(workflow.createUser(input)) - Execute the workflow
     - return { success: true, data: await serializeUser(result) } - Return serialized result
   })
*/

/*
For the create endpoint, we don't need to validate the user (so don't user .use(validateUser))
Reason: New users can't have a JWT token before they're created!

Task creation requires authentication because it's a private endpoint that only 
authenticated users can access
*/ 
export const create = os
  .$context<BaseContext>()
  .input(toStandard(UserDTOs.CreateUserDtoSchema))
  .output(toStandard(UserResponseDTOs.UserResponseDtoSchema))
  // NO AUTHENTICATION - This is a public registration endpoint
  .handler(async ({ input }): Promise<UserResponseDto> => {
    // Get the UserWorkflow instance from the dependency injection container
    const workflow = resolve<UserWorkflow>(TOKENS.USER_WORKFLOW);
    
    // Execute the workflow - no need to enrich with actor info since user doesn't exist yet
    const result = await executeEffect(workflow.createUser(input));
    
    // Serialize user (remove password from response)
    const serializedUser = await serializeUser(result);
    
    // Generate JWT token for the newly created user
    // Default role is "assignee" - you can update this based on your business logic
    const token = generateJWT(
      serializedUser.id,
      serializedUser.email,
      "assignee" // Default role for new users
    );
    
    return {
      success: true,
      data: serializedUser,
      token, // Include JWT token in response
    };
  });

// COMMAND: Update existing user
export const update = os
  .$context<BaseContext>()
  .input(toStandard(UserDTOs.UpdateUserDtoSchema))
  .output(toStandard(UserResponseDTOs.UserResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<UserResponseDto> => {
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
  .output(toStandard(UserResponseDTOs.UserRemoveResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<UserRemoveResponseDto> => {
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
  .output(toStandard(UserResponseDTOs.UsersListResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<UsersListResponseDto> => {
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

