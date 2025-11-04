import { Effect as E, pipe, Option as O } from "effect";
import { eq, and, sql, desc } from "drizzle-orm";
import { TaskRepository } from "@domain/task/task.repository";
import { Task } from "@domain/task/task.entity";
import { RepositoryEffect } from "@domain/utils/base.repository";
import { PaginatedData, PaginationOptions } from "@domain/utils/pagination";
import { PaginatedSearchParams, SerializedTask } from "@domain/task/task.schema";
import { QueryError, MutationError } from "@domain/utils/base.errors";
import { TaskNotFoundError, TaskMutationError } from "@domain/task/task.errors";
import type { IEntity } from "@domain/utils/base.entity";
import { SerializationError, DeserializationError } from "../infra.errors";
import { tasks } from "../db/task.table";
import {buildTextSearchFilter,calculateOffset,buildPaginationMeta,flattenConditions} from "./query-builders";

type DrizzleDB = any;

/**
 * Drizzle-based implementation of TaskRepository
 */
export class TaskDrizzleRepository extends TaskRepository {
  constructor(private readonly db: DrizzleDB) {
    super();
  }

  /**
   * Convert Task entity to database-serialized format
   */
  private toDbSerialized(task: Task): E.Effect<any, SerializationError, never> {
    return pipe(
      task.serialized(),
      E.map((serialized) => ({
        id: serialized.id,
        title: serialized.title,
        description: serialized.description,
        status: serialized.status,
        assigneeId: serialized.assigneeId,
        createdAt: serialized.createdAt,
        updatedAt: serialized.updatedAt,
      })),
      E.mapError((error) => 
        new SerializationError(
          `Failed to serialize task for database: ${error}`,
          "Task",
          task.id
        )
      )
    );
  }

  /**
   * Helper method to check if an entity exists
   */
  private ensureExists(id: IEntity["id"]): E.Effect<void, TaskMutationError, never> {
    return pipe(
      this.fetchById(id),
      E.flatMap((taskOption) =>
        O.match(taskOption, {
          onNone: () => E.fail(new TaskMutationError(
            "update",
            "Task not found",
            "Task",
            id
          )),
          onSome: () => E.succeed(void 0)
        })
      ),
      E.mapError((error) => 
        error instanceof TaskMutationError
          ? error
          : new TaskMutationError("update", `Failed to check task existence: ${error}`, "Task", id)
      )
    );
  }

  /**
   * Convert database row to Task entity
   */
  private fromDbRow(row: any): E.Effect<Task, DeserializationError, never> {
    const serialized: SerializedTask = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      assigneeId: row.assigneeId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return pipe(
      Task.create(serialized),
      E.mapError((error) =>
        new DeserializationError(
          `Failed to deserialize task from database: ${error}`,
          "Task",
          row
        )
      )
    );
  }

  /**
   * Adds a new task to the repository
   */
  add(entity: Task): RepositoryEffect<Task, MutationError> {
    return pipe(
      this.toDbSerialized(entity),
      E.flatMap((dbData) =>
        E.tryPromise({
          try: () => this.db.insert(tasks).values(dbData),
          catch: (error) => new TaskMutationError(
            "add",
            `Failed to add task: ${error}`,
            "Task",
            entity.id
          )
        })
      ),
      E.as(entity)
    );
  }

  /**
   * Updates an existing task in the repository
   */
  update(entity: Task): RepositoryEffect<Task, MutationError> {
    return pipe(
      this.ensureExists(entity.id),
      E.flatMap(() => this.toDbSerialized(entity)),
      E.flatMap((dbData) =>
        E.tryPromise({
          try: () => this.db.update(tasks).set(dbData).where(eq(tasks.id, entity.id)),
          catch: (error) => new TaskMutationError(
            "update",
            `Failed to update task: ${error}`,
            "Task",
            entity.id
          )
        })
      ),
      E.as(entity),
      E.mapError((error) => 
        error instanceof TaskMutationError || error instanceof SerializationError
          ? error as MutationError
          : new TaskMutationError("update", `Failed to update task: ${error}`, "Task", entity.id)
      )
    );
  }

  /**
   * Fetches all tasks from the repository
   */
  fetchAll(): RepositoryEffect<Task[], QueryError> {
    return pipe(
      E.tryPromise({
        try: (): Promise<any[]> => this.db.select().from(tasks),
        catch: (error) => new QueryError(`Failed to fetch all tasks: ${error}`)
      }),
      E.flatMap((rows: any[]) => 
        pipe(
          E.all(rows.map((row: any) => this.fromDbRow(row))),
          E.mapError((error) => new QueryError(`Failed to deserialize tasks: ${error.message}`))
        )
      )
    );
  }

  /**
   * Fetches a task by its ID
   */
  fetchById(id: IEntity["id"]): RepositoryEffect<O.Option<Task>, QueryError> {
    return pipe(
      E.tryPromise({
        try: (): Promise<any[]> => this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1),
        catch: (error) => new QueryError(`Failed to fetch task by id: ${error}`)
      }),
      E.flatMap((rows: any[]) => {
        if (rows.length === 0) {
          return E.succeed(O.none());
        }
        return pipe(
          this.fromDbRow(rows[0]),
          E.map(O.some),
          E.mapError((error) => new QueryError(`Failed to deserialize task: ${error.message}`))
        );
      })
    );
  }

  /**
   * Deletes a task by its ID
   */
  deleteById(id: IEntity["id"]): RepositoryEffect<Task, MutationError> {
    return pipe(
      this.fetchById(id),
      E.flatMap((taskOption) => 
        O.match(taskOption, {
          onNone: () => E.fail(new TaskMutationError(
            "remove", "Task not found","Task",id)),
          onSome: (task) => E.succeed(task)
        })
      ),
      E.tap(() =>
        E.tryPromise({
          try: () => this.db.delete(tasks).where(eq(tasks.id, id)),
          catch: (error) => new TaskMutationError(
            "remove",`Failed to delete task: ${error}`,"Task",id)})),
      E.mapError((error) => 
        error instanceof TaskMutationError
          ? error
          : new TaskMutationError("remove", `Failed to delete task: ${error}`, "Task", id)
      ));
  }

  /**
   * Search for tasks with pagination and text filtering
   */
  search(params: PaginatedSearchParams): RepositoryEffect<PaginatedData<Task>, QueryError> {
    return pipe(
      E.succeed(params),
      E.flatMap((validParams) => {
        // Build WHERE condition - search by title and description
        const conditions = flattenConditions([
          buildTextSearchFilter([tasks.title, tasks.description], validParams.text)
        ]);

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Pagination
        const { page, limit } = validParams;
        const offset = calculateOffset(page, limit);

        // Execute count query
        const countQuery = E.tryPromise({
          try: async (): Promise<number> => {
            const result = await this.db
              .select({ count: sql<number>`count(*)` })
              .from(tasks)
              .where(whereClause);
            return Number(result[0].count);
          },
          catch: (error) => new QueryError(`Failed to count tasks: ${error}`)
        });

        // Execute data query
        const dataQuery = E.tryPromise({
          try: (): Promise<any[]> => this.db
            .select()
            .from(tasks)
            .where(whereClause)
            .orderBy(desc(tasks.createdAt))
            .limit(limit)
            .offset(offset),
          catch: (error) => new QueryError(`Failed to search tasks: ${error}`)
        });

        // Combine queries
        return pipe(
          E.all([countQuery, dataQuery]),
          E.flatMap(([total, rows]: [number, any[]]) =>
            pipe(
              E.all(rows.map((row: any) => this.fromDbRow(row))),
              E.map((taskEntities) => ({
                data: taskEntities,
                pagination: buildPaginationMeta(page, limit, total)
              })),
              E.mapError((error) => new QueryError(`Failed to deserialize tasks: ${error.message}`))
            )
          )
        );
      })
    );
  }
}

