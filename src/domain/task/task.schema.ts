import { Schema as S } from "effect";
import { Optional } from "../utils/validation.utils";
import { TaskIdSchema, UserIdSchema } from "../brand/ids";
import { DateTimeSchema } from "../brand/schemas";
import { TaskGuards } from "./task.guard";
import { PaginatedQuerySchema } from "../utils/pagination";

export const TaskStatusSchema = S.Literal("TODO", "IN_PROGRESS", "DONE")

export const TaskSchema = S.Struct({
  id: TaskIdSchema,
  title: S.String.pipe(TaskGuards.vlaidateTitle),
  description: Optional(S.String.pipe(TaskGuards.validateDescription)),
  status: TaskStatusSchema,
  assigneeId: UserIdSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema
})

export type Task = S.Schema.Type<typeof TaskSchema>
export type SerializedTask = S.Schema.Encoded<typeof TaskSchema>

/**
 * Task-specific sort fields
 */
export const TaskSortBySchema = S.Literal("createdAt", "updatedAt", "title", "status")

/**
 * Paginated search parameters for tasks
 * 
 * Extends base pagination with task-specific filters:
 * - status: filter by task status (single or multiple)
 * - assigneeId: filter by assigned user
 * - text: free-text search in title and description
 * - createdFrom/createdTo: filter by creation date range
 * - sortBy: restricted to task-specific fields
 */
export const PaginatedSearchParams = S.Struct({
  // Base pagination fields
  page: S.Number,
  limit: S.Number,
  sortBy: S.optional(TaskSortBySchema),
  sortOrder: S.optional(S.Literal("asc", "desc")),
  
  // Task-specific filters
  status: S.optional(S.Union(TaskStatusSchema, S.Array(TaskStatusSchema))),
  assigneeId: S.optional(UserIdSchema),
  text: S.optional(S.String),
  createdFrom: S.optional(DateTimeSchema),
  createdTo: S.optional(DateTimeSchema)
}).pipe(
  S.filter((params) => {
    // Validate date range: createdFrom must be <= createdTo
    if (params.createdFrom && params.createdTo) {
      return params.createdFrom <= params.createdTo
    }
    return true
  }, {
    message: () => "createdFrom must be less than or equal to createdTo"
  })
)

export type PaginatedSearchParams = S.Schema.Type<typeof PaginatedSearchParams>
export type SerializedSearchParams = S.Schema.Encoded<typeof PaginatedSearchParams>
