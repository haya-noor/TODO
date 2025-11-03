import type {Effect, Option as O} from "effect";
import type {BaseEntity, IEntity} from "./base.entity.js";
import type {NotFoundError, QueryError, ValidationError, ForbiddenError, MutationError} from "./base.errors.js";
import type {PaginatedData, PaginationOptions} from "./pagination.js";

type CommonRepoErrors = QueryError | ValidationError | ForbiddenError;

/**
 * Common repository errors
 */
export type RepositoryError = NotFoundError | QueryError | ValidationError | ForbiddenError;

export type RepositoryEffect<T, E = CommonRepoErrors> = Effect.Effect<T, E | CommonRepoErrors>;

/**
 * Abstract base repository class that provides common CRUD operations
 * for domain entities, using Effect for error handling
 */
export abstract class BaseRepository<T extends BaseEntity> {
    /**
     * Adds a new entity to the repository
     * @param entity The entity to add
     * @returns An Effect that resolves to the added entity or fails with an error
     */
    abstract add(entity: T): RepositoryEffect<T, ValidationError>;

    /**
     * Updates an existing entity in the repository
     * @param entity The entity to update
     * @returns An Effect that resolves to the updated entity or fails with an error
     */
    abstract update(entity: T): RepositoryEffect<T, NotFoundError>;

    /**
     * Fetches all entities from the repository
     * @returns An Effect that resolves to an array of entities or fails with an error
     */
    fetchAll?(): RepositoryEffect<T[], NotFoundError>;

    /**
     * Fetches a paginated list of entities from the repository
     * @param options Pagination options
     * @returns An Effect that resolves to a paginated result or fails with an error
     */
    fetchPaginated?(options: PaginationOptions): RepositoryEffect<PaginatedData<T>>;

    /**
     * Fetches an entity by its ID
     * @param id The ID of the entity to fetch
     * @returns An Effect that resolves to an Option containing the entity or fails with an error
     */
    fetchById?(id: IEntity["id"]): RepositoryEffect<O.Option<T>, NotFoundError>;

    /**
     * Deletes an entity by its ID
     * @param id The ID of the entity to delete
     * @returns An Effect that resolves to the deleted entity or fails with an error
     */
    deleteById?(id: IEntity["id"]): RepositoryEffect<T, NotFoundError | MutationError>;

  
}
