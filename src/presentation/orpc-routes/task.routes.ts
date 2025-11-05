import { os } from "@orpc/server";
import { resolve, TOKENS } from "@infra/di/container";
import { TaskWorkflow } from "@application/task/task.workflows";
import { validateUser, type BaseContext, type AuthenticatedContext } from "../auth";
import { withActor, executeEffect, serializeEntity, toStandard } from "../orpc-routes/route.utils";
import * as TaskDTOs from "@application/task/task.dtos";
import * as TaskResponseDTOs from "@application/task/task.response.dto";
import type { 
  TaskResponseDto, 
  TasksListResponseDto, 
  TaskSearchResponseDto,
  TaskRemoveResponseDto 
} from "../../app/application/task/task.response.dto";

/**
 * Task Routes
 * Implements CRUD operations for tasks using oRPC
 * 
 * - Commands: Operations that MODIFY state (create, update, delete) → use `command` variable
 * - Queries: Operations that READ state (fetch, getById, search) → use `query` variable
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

/*
create task route (COMMAND - modifies state)
   - .$context<BaseContext>() - Attach context (like user info etc.) from HTTP request headers
   - .input(toStandard(CreateTaskDtoSchema)) - Validate input using DTO schema
   - .output(toStandard(TaskResponseDtoSchema)) - Validate output using response DTO schema
   - .use(validateUser) - Middleware for authentication
   - .handler(async ({ input, context }) => {
     - const workflow = resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW) - Get TaskWorkflow from DI container
     - const command = withActor(input, context) - Enrich input with actor info (user ID, role)
     - const result = await executeEffect(workflow.createTask(command)) - Execute the workflow
     - return { success: true, data: await serializeEntity(result) } - Return serialized result
   })
*/
export const create = os
  .$context<BaseContext>()
  .input(toStandard(TaskDTOs.CreateTaskDtoSchema))
  .output(toStandard(TaskResponseDTOs.TaskResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<TaskResponseDto> => {
    // Get the TaskWorkflow instance from the dependency injection container, which is injected by the DI container
    const workflow = resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW);
    
    // Enrich input with actor info (e.g., user ID, role) using the context
    const command = withActor(input, context);
    
    // Execute the workflow
    const result = await executeEffect(workflow.createTask(command));
    
    return {
      success: true,
      data: await serializeEntity(result),
    };
  });

// COMMAND: Update existing task
export const update = os
  .$context<BaseContext>()
  .input(toStandard(TaskDTOs.UpdateTaskDtoSchema))
  .output(toStandard(TaskResponseDTOs.TaskResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<TaskResponseDto> => {
    const workflow = resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW);
    const command = withActor(input, context); // COMMAND - modifies state
    const result = await executeEffect(workflow.updateTask(command));
    
    return {
      success: true,
      data: await serializeEntity(result),
    };
  });

// COMMAND: Delete task
export const remove = os
  .$context<BaseContext>()
  .input(toStandard(TaskDTOs.RemoveTaskDtoSchema))
  .output(toStandard(TaskResponseDTOs.TaskRemoveResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<TaskRemoveResponseDto> => {
    const workflow = resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW);
    const command = withActor(input, context); // COMMAND - modifies state
    await executeEffect(workflow.deleteTaskById(command));
    
    return {
      success: true,
      id: (input as any).id,
    };
  });

// QUERY: Fetch tasks with pagination
export const fetch = os
  .$context<BaseContext>()
  .input(toStandard(TaskDTOs.TasksPaginationDtoSchema))
  .output(toStandard(TaskResponseDTOs.TasksListResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<TasksListResponseDto> => {
    const workflow = resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW);
    const query = withActor(input, context); // QUERY - reads state
    const result = await executeEffect(workflow.getTasksPaginated(query));
    
    const serializedTasks = await Promise.all(
      result.map((task: any) => serializeEntity(task))
    );
    
    return {
      success: true,
      data: serializedTasks,
    };
  });

// QUERY: Get task by ID
export const getById = os
  .$context<BaseContext>()
  .input(toStandard(TaskDTOs.RemoveTaskDtoSchema)) // Uses same schema as remove (id only)
  .output(toStandard(TaskResponseDTOs.TaskResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<TaskResponseDto> => {
    const workflow = resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW);
    const query = withActor(input, context); // QUERY - reads state
    const result = await executeEffect(workflow.getTaskById(query));
    
    return {
      success: true,
      data: await serializeEntity(result),
    };
  });

// QUERY: Get all tasks (no input needed)
export const getAll = os
  .$context<BaseContext>()
  .output(toStandard(TaskResponseDTOs.TasksListResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<TasksListResponseDto> => {
    const workflow = resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW);
    const result = await executeEffect(workflow.getAllTasks()); // No input enrichment needed
    
    const serializedTasks = await Promise.all(
      result.map((task: any) => serializeEntity(task))
    );
    
    return {
      success: true,
      data: serializedTasks,
    };
  });

// QUERY: Search tasks with filters and pagination
export const search = os
  .$context<BaseContext>()
  .input(toStandard(TaskDTOs.TaskSearchDtoSchema))
  .output(toStandard(TaskResponseDTOs.TaskSearchResponseDtoSchema))
  .use(validateUser)
  .handler(async ({ input, context }): Promise<TaskSearchResponseDto> => {
    const workflow = resolve<TaskWorkflow>(TOKENS.TASK_WORKFLOW);
    const query = withActor(input, context); // QUERY - reads state
    const result = await executeEffect(workflow.searchTasks(query));
    
    const serializedTasks = await Promise.all(
      result.data.map((task: any) => serializeEntity(task))
    );
    
    return {
      data: serializedTasks,
      pagination: result.pagination,
    };
  });

