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

/*
input : unknown (becasue input is coming from the client,input could be anything like a string, number, object, etc.)
output : entityEffect: Effect<Task, TaskValidationError, never> 

TaskRepository is an interface that defines the methods that a task repository must implement. 
it is used to add the task to the database. 
*/

// createTaskWorkflow
export const createTask = (repo: TaskRepository) => (input: unknown): E.Effect<Task, TaskValidationError, never> =>
  pipe(
    S.decodeUnknown(CreateTaskDtoSchema)(input),
    E.mapError(() => new TaskValidationError("Invalid create task input", "task", input)),
    E.map((dto: CreateTaskDto) => ({
      ...dto,
      id: TaskId.fromTrusted(UUID.init()),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    })),
    E.flatMap((data: S.Schema.Type<typeof TaskSchema>) => 
      pipe(
        S.encode(TaskSchema)(data),
        E.mapError(() => new TaskValidationError("Invalid create task input", "task", input))
      )
    ),
    E.flatMap((serialized) => 
      pipe(
        Task.create(serialized),
        E.mapError(() => new TaskValidationError("Invalid create task input", "task", input))
      )
    ),
    E.flatMap((entity) => 
      pipe(
        repo.add(entity),
        E.mapError(() => new TaskValidationError("Failed to create task", "task", input))
      )
    )
  );
// updateTaskWorkflow
/*
once we update the task, this line : E.flatMap((nextSerialized) => Task.create(nextSerialized)) 
will create a new task with the new values. because entities are immutable, we don't modify the
 existing task, we create a new one.

repo.update(updated) will replace the old entity with the new one. 
*/
export const updateTask = (repo: TaskRepository) => (input: unknown): E.Effect<Task, TaskValidationError | TaskNotFoundError, never> => 
    pipe(
    S.decodeUnknown(UpdateTaskDtoSchema)(input),
    E.mapError(() => new TaskValidationError("Invalid update task input", "task", input)),
    E.flatMap((dto: UpdateTaskDto) =>
      pipe(
        // fetch the task from the database (ensures the task exists)
        repo.fetchById(dto.id),
        E.mapError(() => new TaskNotFoundError(String(dto.id))),
        E.flatMap((maybe) =>
          O.match(maybe, {
            onNone: () => E.fail(new TaskNotFoundError(String(dto.id))),
            onSome: (existing) => pipe(
              existing.serialized(), 
              E.mapError(() => new TaskValidationError("Failed to serialize existing task", "task", input))
            )})
        ),
        // update the task with the new values 
        E.map((current: SerializedTask) => ({ 
          ...current, 
          ...dto, 
          updatedAt: DateTime.now() 
        })),
        E.flatMap((nextSerialized) => Task.create(nextSerialized)),
        E.mapError(() => new TaskValidationError("Invalid task update payload", "task", input)),
        E.flatMap((updated) => pipe(
          repo.update(updated),
          E.mapError(() => new TaskNotFoundError(String(dto.id)))
)))));



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
    E.flatMap((params: TaskSearchDto) => 
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

  createTask(input: unknown): E.Effect<Task, TaskValidationError, never> {
    return createTask(this.repo)(input);
  }

  updateTask(input: unknown): E.Effect<Task, TaskValidationError | TaskNotFoundError, never> {
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

