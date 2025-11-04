import { Effect, Schema as S } from "effect"

/**
 * Pagination Module
 * 
 * Centralized pagination utilities with Effect integration.
 * All pagination-related types and functions are defined here.
 */

// ---------------------------------------------------------------------------
// Core Pagination Types
// ---------------------------------------------------------------------------

/**
 * Base paginated query schema
 * 
 * Foundation for all paginated queries with validation:
 * - page: >= 1
 * - limit: 1-100
 * - sortBy: optional string (domain-specific)
 * - sortOrder: "asc" or "desc"
 * 
 * Extend this schema in domain modules to add filters.
 */
export const PaginatedQuerySchema = S.Struct({
  page: S.Number,
  limit: S.Number,
  sortBy: S.optional(S.String),
  sortOrder: S.optional(S.Literal("asc", "desc"))
})

export type PaginatedQuery = S.Schema.Type<typeof PaginatedQuerySchema>

/**
 * Pagination options schema with validation
 *
 * Ensures pagination parameters are valid:
 * - page: >= 1
 * - limit: 1-100
 * - sortOrder: "asc" or "desc"
 * 
 * @deprecated Use PaginatedQuerySchema for new code
 */
export const PaginationOptions = PaginatedQuerySchema

export type PaginationOptions = S.Schema.Type<typeof PaginationOptions>

/**
 * Paginated data wrapper
 * 
 * Standard format for paginated collections.
 * This is the source of truth for pagination structure.
 */
export interface PaginatedData<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Pagination metadata schema
 * 
 * Schema definition that matches PaginatedData['pagination'] structure.
 * Used for runtime validation in response DTOs.
 */
export const PaginationMetaSchema = S.Struct({
  page: S.Number,
  limit: S.Number,
  total: S.Number,
  totalPages: S.Number,
  hasNext: S.Boolean,
  hasPrev: S.Boolean,
})

export type PaginationMeta = S.Schema.Type<typeof PaginationMetaSchema>

/**
 * Create a PaginatedData schema for a given data type schema
 * 
 * This factory function creates a schema that matches PaginatedData<T> structure.
 * Reuses the existing PaginatedData interface and pagination helpers.
 * 
 * @param dataSchema - Schema for the data array elements
 * @returns Schema for PaginatedData<T>
 * 
 * @example
 * ```typescript
 * const TasksPaginatedSchema = createPaginatedDataSchema(TaskBasicViewDtoSchema)
 * // Returns: Schema<PaginatedData<Task>>
 * ```
 */
export const createPaginatedDataSchema = <A, I, R>(dataSchema: S.Schema<A, I, R>) =>
  S.Struct({
    data: S.Array(dataSchema),
    pagination: PaginationMetaSchema,
  })


/**
 * Calculate offset from page and limit
 */
export const calculateOffset = (page: number, limit: number): number => 
  (page - 1) * limit

/**
 * Calculate total pages from total items and limit
 */
export const calculateTotalPages = (total: number, limit: number): number =>
  Math.ceil(total / limit)

/**
 * Check if there is a next page
 */
export const hasNextPage = (page: number, totalPages: number): boolean =>
  page < totalPages

/**
 * Check if there is a previous page
 */
export const hasPreviousPage = (page: number): boolean =>
  page > 1

/**
 * Create pagination metadata object
 */
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => ({
  page,
  limit,
  total,
  totalPages: calculateTotalPages(total, limit),
  hasNext: hasNextPage(page, calculateTotalPages(total, limit)),
  hasPrev: hasPreviousPage(page),
})

/**
 * Build paginated data from collection and pagination params
 */
export const buildPaginatedData = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedData<T> => ({
  data,
  pagination: createPaginationMeta(page, limit, total),
})

/**
 * Execute a count query and build paginated response
 * 
 * Generic helper to combine data fetching with count query
 */
export const withPaginationCount = <T, Err = unknown>(
  data: T[],
  countEffect: Effect.Effect<number, Err>,
  params: PaginationOptions
): Effect.Effect<PaginatedData<T>, Err> =>
  Effect.map(countEffect, (total) =>
    buildPaginatedData(data, params.page, params.limit, total)
  )

/**
 * Validate pagination parameters
 * 
 * Ensures page and limit are positive integers using Effect Schema.
 */
export const validatePaginationParams = (
  params: Partial<PaginationOptions>
): Effect.Effect<PaginationOptions, unknown> =>
  S.decodeUnknown(PaginationOptions)({
    page: params.page ?? DEFAULT_PAGINATION.page,
    limit: params.limit ?? DEFAULT_PAGINATION.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder
  })

/**
 * Default pagination params
 */
export const DEFAULT_PAGINATION: PaginationOptions = {
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
}

/**
 * Apply default pagination values
 */
export const withDefaults = (
  params?: Partial<PaginationOptions>
): PaginationOptions => ({
  ...DEFAULT_PAGINATION,
  ...params,
})

// ---------------------------------------------------------------------------
// Paginator Utility Class
// ---------------------------------------------------------------------------

/**
 * Paginator - Utility for paginating collections with Effect
 * 
 * Provides a fluent API for paginating data with proper Effect integration.
 * Handles validation, offset calculation, and response building.
 * 
 * @example
 * ```typescript
 * const paginator = new Paginator<User>()
 * 
 * const result = paginator
 *   .paginate(users)
 *   .withOptions({ page: 2, limit: 10 })
 *   .withTotal(totalCount)
 *   .build()
 * ```
 */
export class Paginator<T> {
  private data: T[] = []
  private options: PaginationOptions = DEFAULT_PAGINATION as PaginationOptions
  private totalCount: number = 0

  /**
   * Set the data to paginate
   */
  paginate(data: T[]): this {
    this.data = data
    return this
  }

  /**
   * Set pagination options with validation
   */
  withOptions(options: Partial<PaginationOptions>): Effect.Effect<this, unknown> {
    return validatePaginationParams(options).pipe(
      Effect.map((validated: PaginationOptions) => {
        this.options = validated
        return this
      })
    )
  }

  /**
   * Set total count for pagination metadata
   */
  withTotal(total: number): this {
    this.totalCount = total
    return this
  }

  /**
   * Build the paginated response
   */
  build(): PaginatedData<T> {
    return buildPaginatedData(
      this.data,
      this.options.page,
      this.options.limit,
      this.totalCount
    )
  }

  /**
   * Build paginated response as Effect
   */
  buildEffect(): Effect.Effect<PaginatedData<T>, never> {
    return Effect.succeed(this.build())
  }

  /**
   * Static factory method for cleaner usage
   */
  static create<T>() {
    return new Paginator<T>()
  }

  /**
   * One-shot pagination helper
   * 
   * Convenience method for simple pagination without builder pattern.
   * 
   * @example
   * ```typescript
   * const result = Paginator.paginate(users, { page: 1, limit: 10 }, 100)
   * // Effect<PaginatedData<User>, unknown>
   * ```
   */
  static paginate<T>(
    data: T[],
    options: Partial<PaginationOptions>,
    total: number
  ): Effect.Effect<PaginatedData<T>, unknown> {
    return validatePaginationParams(options).pipe(
      Effect.map((validated: PaginationOptions) => buildPaginatedData(data, validated.page, validated.limit, total))
    )
  }

  /**
   * Paginate Effect-wrapped data
   * 
   * Chains pagination after an Effect that produces data.
   * 
   * @example
   * ```typescript
   * const users = Effect.succeed([user1, user2, user3])
   * const paginated = Paginator.paginateEffect(
   *   users,
   *   { page: 1, limit: 10 },
   *   () => Effect.succeed(3)
   * )
   * ```
   */
  static paginateEffect<T, Err>(
    dataEffect: Effect.Effect<T[], Err>,
    options: Partial<PaginationOptions>,
    countEffect: () => Effect.Effect<number, Err>
  ): Effect.Effect<PaginatedData<T>, Err | unknown> {
    return validatePaginationParams(options).pipe(
      Effect.flatMap((validated) =>
        dataEffect.pipe(
          Effect.flatMap((data) =>
            countEffect().pipe(
              Effect.map((total) =>
                buildPaginatedData(data, validated.page, validated.limit, total)
              )
            )
          )
        )
      )
    )
  }
}

