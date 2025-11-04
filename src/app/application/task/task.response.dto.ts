import { Schema as S } from "effect";
import { TaskBasicViewDtoSchema } from "./task.dtos";
import { createPaginatedDataSchema } from "../../domain/utils/pagination";

// create, update, getById response 
export const TaskResponseDtoSchema = S.Struct({
  success: S.Boolean,           
  data: TaskBasicViewDtoSchema, // Properly typed as Task
});

// list response (fetch, getAll)
export const TasksListResponseDtoSchema = S.Struct({
  success: S.Boolean,
  data: S.Array(TaskBasicViewDtoSchema), // Properly typed as Task[]
});

// search response 
// search response with pagination 
export const TaskSearchResponseDtoSchema = createPaginatedDataSchema(TaskBasicViewDtoSchema);

// remove (delete) response
export const TaskRemoveResponseDtoSchema = S.Struct({
  success: S.Boolean,
  id: S.String,
});

// Response DTO Types
export type TaskResponseDto = S.Schema.Type<typeof TaskResponseDtoSchema>;
export type TasksListResponseDto = S.Schema.Type<typeof TasksListResponseDtoSchema>;
export type TaskSearchResponseDto = S.Schema.Type<typeof TaskSearchResponseDtoSchema>;
export type TaskRemoveResponseDto = S.Schema.Type<typeof TaskRemoveResponseDtoSchema>;

