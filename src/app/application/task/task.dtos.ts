import { Schema as S } from "effect";

import { TaskSchema, PaginatedSearchParams } from "../../domain/task/task.schema";
import { TaskIdSchema } from "../../domain/brand/ids";
import { PaginationOptions } from "../../domain/utils/pagination";

/**
 * Task Request DTOs
 * Defines the input schemas for task operations
 * Response DTOs are in task.response.dto.ts
 */

// Create (add) DTO: client provides fields (no id/timestamps)
export const CreateTaskDtoSchema = TaskSchema.pick("title", "description", "status", "assigneeId");

// Update DTO: id required, other fields optional (partial update)
export const UpdateTaskDtoSchema = S.Struct({
  id: TaskSchema.fields.id,
}).pipe(
  S.extend(S.partial(TaskSchema.pick("title", "description", "status", "assigneeId")))
);
// Remove DTO: id only
export const RemoveTaskDtoSchema = TaskSchema.pick("id");

// View (fetch) DTO: all fields are safe to expose
export const TaskBasicViewDtoSchema = TaskSchema;

// Pagination DTO (reuse shared schema)
export const TasksPaginationDtoSchema = PaginationOptions;

// Search DTO: use task-specific search params
export const TaskSearchDtoSchema = PaginatedSearchParams;

// Request DTO Types



export type CreateTaskDto = S.Schema.Encoded<typeof CreateTaskDtoSchema>;


export type UpdateTaskDto = S.Schema.Encoded<typeof UpdateTaskDtoSchema>;
export type RemoveTaskDto = S.Schema.Encoded<typeof RemoveTaskDtoSchema>;
export type TaskBasicViewDto = S.Schema.Type<typeof TaskBasicViewDtoSchema>;
export type TasksPaginationDto = S.Schema.Type<typeof TasksPaginationDtoSchema>;
export type TaskSearchDto = S.Schema.Type<typeof TaskSearchDtoSchema>;
export type TaskIdParam = S.Schema.Type<typeof TaskIdSchema>;

