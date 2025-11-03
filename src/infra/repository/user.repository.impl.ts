import { Effect as E, pipe, Option as O } from "effect";
import { eq, and, sql, desc } from "drizzle-orm";
import { UserRepository } from "../../domain/user/user.repository";
import { User } from "../../domain/user/user.entity";
import { RepositoryEffect } from "../../domain/utils/base.repository";
import { PaginatedData, PaginationOptions } from "../../domain/utils/pagination";
import { SerializedUser } from "../../domain/user/user.schema";
import { QueryError, MutationError, ForbiddenError } from "../../domain/utils/base.errors";
import { UserNotFoundError, UserMutationError } from "../../domain/user/user.errors";
import type { IEntity } from "../../domain/utils/base.entity";
import { SerializationError, DeserializationError } from "../infra.errors";
import { users } from "../db/user.table";
import { UUID } from "../../domain/brand/constructors";
import { calculateOffset, buildPaginationMeta } from "./query-builders";

type DrizzleDB = any;

/**
 * Drizzle-based implementation of UserRepository
 */
export class UserDrizzleRepository extends UserRepository {
  constructor(private readonly db: DrizzleDB) {
    super();
  }

  /**
   * Convert SerializedUser to database format
   * Input: SerializedUser (already serialized)
   * Output: Database-ready format (in this case, same as SerializedUser)
   * why not the E.mapError to handle the SerializationError?
   * because the SerializedUser is already in the correct format, so we don't need to 
   * serialize it again
   * and the caller(add, update, etc.) will handle the SerializationError if it occurs
   */
  private toDbSerialized(serialized: SerializedUser): E.Effect<SerializedUser, SerializationError, never> {
    return E.succeed(serialized);
  }

  /**
   * Helper method to check if userexists
   */
  private ensureExists(id: IEntity["id"]): E.Effect<void, QueryError, never> {
    return pipe(
      this.fetchById(id),
      E.flatMap((userOption) => O.match(userOption, {
          onNone: () => E.fail(new UserNotFoundError(id)),
          onSome: () => E.succeed(void 0) })),
      E.mapError((error) => 
        error instanceof QueryError ? error : new QueryError(`Failed to check user existence: ${error}`)));
  }

  /**
   * Convert database row to User entity
   * input: any - database row
   * output: User entity or error
   * DB row -> user entity (using User.create)
   */
  private fromDbRow(row: any): E.Effect<User, DeserializationError, never> {
    return pipe(
      User.create(row as SerializedUser),
      E.mapError((error) =>
        new DeserializationError(`Failed to deserialize user from database: ${error}`, "User", row)));
  }

  /**
   * Adds a new user to the repository
   */
  add(entity: User): RepositoryEffect<User, MutationError> {
    return pipe(
      entity.serialized(),
      E.flatMap((serialized) => this.toDbSerialized(serialized)),
      E.flatMap((dbData) =>
        E.tryPromise({
          try: () => this.db.insert(users).values(dbData),
          catch: (error) => new UserMutationError("add", `Failed to add user: ${error}`, "User", entity.id)})
      ),
      E.as(entity),
      E.mapError((error) =>
        error instanceof UserMutationError || error instanceof SerializationError
          ? error as MutationError : new UserMutationError("add", `Failed to add user: ${error}`, "User", entity.id)
      )
    );
  }

  /**
   * Updates an existing user in the repository
   */
  update(entity: User): RepositoryEffect<User, MutationError> {
    return pipe(
      this.ensureExists(entity.id),
      E.flatMap(() => entity.serialized()),
      E.flatMap((serialized) => this.toDbSerialized(serialized)),
      E.flatMap((dbData) => E.tryPromise({
          try: () => this.db.update(users).set(dbData).where(eq(users.id, entity.id)),
          catch: (error) => new UserMutationError( "update", `Failed to update user: ${error}`, "User", entity.id)})
      ),
      E.as(entity),
      E.mapError((error) => 
        error instanceof UserMutationError || error instanceof SerializationError
          ? error as MutationError : new UserMutationError("update", `Failed to update user: ${error}`, "User", entity.id)
      )
    );
  }

  /**
   * Fetches all users from the repository
   * try: 
   * The "try" part executes a DB read: SELECT * FROM users
   * catch:
   * If the Promise rejects, wrap the failure into a domain-level QueryError
   * flatMap: 
   * When the SELECT succeeds, we have an array of raw DB rows (any[])
   * E.all, rows.map : 
   * For each row, run domain deserialization/validation (this.fromDbRow)
   * E.all collects all per-row Effects into a single Effect of User[]
   */
  fetchAll(): RepositoryEffect<User[], QueryError> {
    return pipe(
      E.tryPromise({
        try: (): Promise<any[]> => this.db.select().from(users),
        catch: (error) => new ForbiddenError(`User is not authorized to fetch all users: ${error}`)
      }),
      E.flatMap((rows: any[]) =>  pipe(
          E.all(rows.map((row: any) => this.fromDbRow(row))),
          E.mapError((error) => new DeserializationError(`Failed to deserialize users: ${error.message}`, "User")))
      ));
  }

  /**
   * Fetches a user by its ID
   */
  fetchById(id: IEntity["id"]): RepositoryEffect<O.Option<User>, QueryError> {
    // Short-circuit invalid UUIDs using shared brand helper to avoid Postgres errors
    const idString = String(id);
    if (!UUID.isValid(idString)) {
      return E.succeed(O.none());
    }

    return pipe(
      E.tryPromise({
        try: (): Promise<any[]> => this.db.select().from(users).where(eq(users.id, id)).limit(1),
        catch: (error) => new QueryError(`Failed to fetch user by id: ${error}`)
      }),
      //  If the SELECT succeeds, we get an array of rows (0 or 1 here due to LIMIT 1)
      E.flatMap((rows: any[]) => { if (rows.length === 0) {return E.succeed(O.none());}
        return pipe(
          //No rows found? Succeed with Option.none (meaning "no user with that id")
          this.fromDbRow(rows[0]), E.map(O.some),
          E.mapError((error) => new QueryError(`Failed to deserialize user: ${error.message}`))
        );
      })
    );
  }

  /**
   * Deletes a user by its ID
   */
  deleteById(id: IEntity["id"]): RepositoryEffect<User, MutationError> {
    return pipe(
      this.fetchById(id),
      E.flatMap((userOption) => O.match(userOption, {
          onNone: () => E.fail(new UserMutationError("remove", "User not found","User",id)),
          onSome: (user) => E.succeed(user)})
      ),
      E.tap(() =>
        E.tryPromise({
          try: () => this.db.delete(users).where(eq(users.id, id)),
          catch: (error) => new UserMutationError("remove",`Failed to delete user: ${error}`,"User",id)})),
      E.mapError((error) => 
        error instanceof UserMutationError ? error : new UserMutationError("remove", `Failed to delete user: ${error}`, "User", id)
      ));
  }

  /**
   * Fetches users with pagination
   * CountQuery: returns a single number: the total number of rows that match the filter 
   * (ignores LIMIT/OFFSET). It's for pagination metadata (total, totalPages, hasNext, etc.).
   * DataQuery: returns the actual page of rows you want to display/return to the caller
   * dataQuery returns the raw DB rows for that page.
   * Then you run this.fromDbRow on each row to get User entities.
   * Finally you bundle them with pagination: buildPaginationMeta(page, limit, total) and 
   * return that to the caller of fetchPaginated(...).
   */
  fetchPaginated(options: PaginationOptions): RepositoryEffect<PaginatedData<User>> {
    return pipe(
      E.succeed(options),
      E.flatMap((validOptions) => {
        // Pagination
        const { page, limit } = validOptions;
        const offset = calculateOffset(page, limit);

        const countQuery = E.tryPromise({
          try: async (): Promise<number> => {
            const result = await this.db.select({ count: sql<number>`count(*)` }).from(users);
            return Number(result[0].count);
          },
          catch: (error) => new QueryError(`Failed to count users: ${error}`)
        });

        const dataQuery = E.tryPromise({
          try: (): Promise<any[]> =>
            this.db.select().from(users).orderBy(desc(users.createdAt), desc(users.id)).limit(limit).offset(offset),
          catch: (error) => new QueryError(`Failed to fetch paginated users: ${error}`)
        });

        // Combine queries
        return pipe(
          E.all([countQuery, dataQuery]),
          E.flatMap(([total, rows]: [number, any[]]) =>
            pipe(
              E.all(rows.map((row: any) => this.fromDbRow(row))),
              E.map((userEntities) => ({data: userEntities,pagination: buildPaginationMeta(page, limit, total)
              })),
              E.mapError((error) => new DeserializationError(`Failed to deserialize users: ${error.message}`, "User"))
            ))
        );})
    );}
}



