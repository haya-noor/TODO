// base.errors.ts

export abstract class DomainError extends Error {
    abstract tag: string
    abstract code: string
    readonly details?: Record<string, unknown>
  
    constructor(message: string, details?: Record<string, unknown>) {
      super(message)
      this.details = details
    }
  }
  
  // 1. Validation Error (e.g., invalid UUID, short desc)
  export class ValidationError extends DomainError {
    tag = "ValidationError"
    code = "VALIDATION_ERROR"
  
    constructor(
      message: string,
      public readonly field?: string,
      public readonly value?: unknown,
      details?: Record<string, unknown>
    ) {
      super(message, { field, value, ...details })
    }
  }
  
  //  2. Forbidden Error (unauthorized action)
  export class ForbiddenError extends DomainError {
    tag = "ForbiddenError"
    code = "FORBIDDEN"
  
    constructor(
      message = "You are not authorized to perform this action",
      public readonly action?: string,
      details?: Record<string, unknown>
    ) {
      super(message, { action, ...details })
    }
  }
  
  // 3. Query Error (base type for read/fetch issues)
  export class QueryError extends DomainError {
    tag = "QueryError"
    code = "QUERY_ERROR"
  
    constructor(
      message: string,
      details?: Record<string, unknown>
    ) {
      super(message, details)
    }
  }
  
  // 4. NotFoundError (subtype of QueryError)
  export class NotFoundError extends QueryError {
    tag = "NotFoundError"
    code = "NOT_FOUND"
  
    constructor(
      message: string,
      public readonly entity?: string,
      public readonly field?: string,
      public readonly value?: unknown,
      details?: Record<string, unknown>
    ) {
      super(message, { entity, field, value, ...details })
    }
  }
  
  // 5. Mutation Error (for write operations like add, update, remove)
  export type MutationOperation = "add" | "update" | "remove"
  
  export class MutationError extends DomainError {
    tag = "MutationError"
    code = "MUTATION_ERROR"
  
    constructor(
      public readonly operation: MutationOperation,
      message = `${operation.charAt(0).toUpperCase()}${operation.slice(1)} error`,
      public readonly entity?: string,
      public readonly id?: unknown,
      details?: Record<string, unknown>
    ) {
      super(message, { operation, entity, id, ...details })
    }
  }
  