import "reflect-metadata";
import { Effect as E, pipe, Option as O, Schema as S } from "effect";
import { injectable, inject } from "tsyringe";

import { Task } from "../../domain/task/task.entity";
import { TaskRepository } from "../../domain/task/task.repository";
import { TaskNotFoundError, TaskValidationError, TaskMutationError } from "../../domain/task/task.errors";
import type { PaginatedData } from "../../domain/utils/pagination";
import { UUID, DateTime } from "../../domain/brand/constructors";
import { TaskSchema, type SerializedTask } from "../../domain/task/task.schema";
import { TOKENS } from "../../infra/di/tokens";

import {
  CreateTaskDtoSchema, UpdateTaskDtoSchema, RemoveTaskDtoSchema, TasksPaginationDtoSchema, TaskSearchDtoSchema,
  type CreateTaskDto, type UpdateTaskDto, type TasksPaginationDto, type TaskSearchDto,
} from "./task.dtos";
import { TaskIdSchema, TaskId } from "../../domain/brand/ids";


export const createTask = (repo: TaskRepository) => (input: CreateTaskDto): E.Effect<Task, TaskValidationError, never> =>
  pipe(
    E.succeed({
      ...input,
      id: TaskId.fromTrusted(UUID.init()),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    }),
    E.flatMap((data: SerializedTask) => Task.create(data)),
    E.flatMap((entity) => repo.add(entity)),
  )


export const updateTask = (repo: TaskRepository) => (input: UpdateTaskDto): E.Effect<SerializedTask, TaskValidationError | TaskNotFoundError, never> => 
    pipe(
    E.succeed(input),
    E.flatMap((data) =>
      pipe(
        repo.fetchById(TaskId.fromTrusted(data.id)),
        E.mapError(() => new TaskNotFoundError(String(data.id))),
        E.flatMap((maybe) =>
          O.match(maybe, {
            onNone: () => E.fail(new TaskNotFoundError(String(data.id))),
            onSome: (existing) => pipe(
              existing.serialized(), 
              E.mapError(() => new TaskValidationError("Failed to serialize existing task", "task", input))
            )})
        ),
        E.map((current) => {
          // extract only the task fields, excluding actorId and actorRole that may be added by withActor (from context in routes)
          // because we're updating task, we don't want to update actorId and actorRole
          const { actorId, actorRole, ...taskdata } = data as UpdateTaskDto & { actorId?: string; actorRole?: string };
          
          // Only include fields that are actually provided and are part of SerializedTask schema
          // Filter out undefined values to avoid schema validation issues
          const updated: SerializedTask = {
            ...current,
            id: taskdata.id ?? current.id,
            ...(taskdata.title !== undefined && { title: taskdata.title }),
            ...(taskdata.description !== undefined && { description: taskdata.description }),
            ...(taskdata.status !== undefined && { status: taskdata.status }),
            ...(taskdata.assigneeId !== undefined && { assigneeId: taskdata.assigneeId }),
            updatedAt: DateTime.now()
          };
          return updated;
        }),
        E.flatMap((nextSerialized) => Task.create(nextSerialized)),
        E.mapError(() => new TaskValidationError("Invalid task update payload", "task", input)),
        E.flatMap((updated) => repo.update(updated)),
        E.flatMap((updatedEntity) => updatedEntity.serialized()),
      )
    )
  );



// getAllTasksWorkflow
export const getAllTasks = (repo: TaskRepository): E.Effect<Task[], TaskValidationError, never> => 
  pipe(repo.fetchAll(),E.mapError(() => new TaskValidationError("Failed to fetch tasks")));



// getTaskByIdWorkflow: return NotFound if none
export const getTaskById = (repo: TaskRepository) => (id: unknown): E.Effect<Task, TaskValidationError | TaskNotFoundError, never> =>
  pipe(
    S.decodeUnknown(TaskIdSchema)(id),
    E.mapError(() => new TaskValidationError("Invalid task id", "id", id)),
    E.flatMap((validId) =>
      pipe(repo.fetchById(validId), // fetch the task from the database (ensures the task exists)
        E.mapError(() => new TaskNotFoundError(String(id))),
        E.flatMap((maybe) => O.match(maybe, {
          onNone: () => E.fail(new TaskNotFoundError(String(id))),
          onSome: (task) => E.succeed(task),
        }))))
  );

// removeTaskWorkflow
export const deleteTaskById = (repo: TaskRepository) => (input: unknown
): E.Effect<Task, TaskValidationError | TaskNotFoundError , never> =>
  pipe(
    S.decodeUnknown(RemoveTaskDtoSchema)(input),
    E.mapError(() => new TaskValidationError("Invalid task id", "id", input)),
    E.flatMap((dto) => 
      pipe(repo.deleteById(dto.id),
        E.mapError((error) => new TaskNotFoundError("Failed to delete task", "Task", dto.id)
))));


// getTasksPaginatedWorkflow
export const getTasksPaginated = (repo: TaskRepository) => (input: unknown): E.Effect<Task[], TaskValidationError, never> =>
  pipe(
    S.decodeUnknown(TasksPaginationDtoSchema)(input),
    E.mapError(() => new TaskValidationError("Invalid pagination params")),
    E.flatMap((options: TasksPaginationDto) => 
      pipe(repo.fetchAll(),E.mapError(() => new TaskValidationError("Failed to fetch paginated tasks"))
)));


// searchTasksWorkflow: uses task-specific search parameters
export const searchTasks = (repo: TaskRepository) => (input: unknown): E.Effect<PaginatedData<Task>, TaskValidationError, never> =>
  pipe(
    S.decodeUnknown(TaskSearchDtoSchema)(input),
    E.mapError(() => new TaskValidationError("Invalid search params", "searchParams", input)),
    E.flatMap((params) => 
      pipe(repo.search(params), E.mapError(() => new TaskValidationError("Failed to search tasks"))
)));

/**
 * TaskWorkflow Class
 * Injectable workflow class that wraps functional workflows
 * This allows workflows to be resolved from DI container with repository already injected
 */
@injectable()
export class TaskWorkflow {
  constructor(@inject(TOKENS.TASK_REPOSITORY) private readonly repo: TaskRepository) {}

  createTask(input: CreateTaskDto): E.Effect<Task, TaskValidationError, never> {
    return createTask(this.repo)(input);
  }

  updateTask(input: UpdateTaskDto): E.Effect<SerializedTask, TaskValidationError | TaskNotFoundError, never> {
    return updateTask(this.repo)(input);
  }

  deleteTaskById(input: unknown): E.Effect<Task, TaskValidationError | TaskNotFoundError, never> {
    return deleteTaskById(this.repo)(input);
  }

  getAllTasks(): E.Effect<Task[], TaskValidationError, never> {
    return getAllTasks(this.repo);
  }

  getTaskById(id: unknown): E.Effect<Task, TaskValidationError | TaskNotFoundError, never> {
    return getTaskById(this.repo)(id);
  }

  getTasksPaginated(input: unknown): E.Effect<Task[], TaskValidationError, never> {
    return getTasksPaginated(this.repo)(input);
  }

  searchTasks(input: unknown): E.Effect<PaginatedData<Task>, TaskValidationError, never> {
    return searchTasks(this.repo)(input);
  }
}

