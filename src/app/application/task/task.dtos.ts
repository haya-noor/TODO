import { Schema as S } from "effect";

import { TaskSchema, PaginatedSearchParams } from "../../domain/task/task.schema";
import { TaskIdSchema } from "../../domain/brand/ids";
import { PaginationOptions } from "../../domain/utils/pagination";

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

// Response DTOs
// TaskResponseDtoSchema is used as a response for the createTaskDTo (create)
export const TaskResponseDtoSchema = S.Struct({
  success: S.Boolean,
  data: S.Any,
});

// TasksListResponseDtoSchema is used as a response for list operations (fetch, getAll)
export const TasksListResponseDtoSchema = S.Struct({
  success: S.Boolean,
  data: S.Array(S.Any),
});

// TaskSearchResponseDtoSchema is used as a response for the searchTasksDto (search)
export const TaskSearchResponseDtoSchema = S.Struct({
  data: S.Array(S.Any),
  pagination: S.Any, // Pagination structure
});

// TaskRemoveResponseDtoSchema is used as a response for the removeTaskDto (delete) with success flag
export const TaskRemoveResponseDtoSchema = S.Struct({
  success: S.Boolean,
  id: S.String,
});

// DTO Types
export type CreateTaskDto = S.Schema.Type<typeof CreateTaskDtoSchema>;
export type UpdateTaskDto = S.Schema.Type<typeof UpdateTaskDtoSchema>;
export type RemoveTaskDto = S.Schema.Type<typeof RemoveTaskDtoSchema>;
export type TaskBasicViewDto = S.Schema.Type<typeof TaskBasicViewDtoSchema>;
export type TasksPaginationDto = S.Schema.Type<typeof TasksPaginationDtoSchema>;
export type TaskSearchDto = S.Schema.Type<typeof TaskSearchDtoSchema>;
export type TaskIdParam = S.Schema.Type<typeof TaskIdSchema>;

// Response DTO Types
export type TaskResponseDto = S.Schema.Type<typeof TaskResponseDtoSchema>;
export type TasksListResponseDto = S.Schema.Type<typeof TasksListResponseDtoSchema>;
export type TaskSearchResponseDto = S.Schema.Type<typeof TaskSearchResponseDtoSchema>;
export type TaskRemoveResponseDto = S.Schema.Type<typeof TaskRemoveResponseDtoSchema>;

