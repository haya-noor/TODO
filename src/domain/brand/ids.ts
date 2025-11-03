import { Brand } from "effect";
import { Schema as S } from "effect";
import { UUIDSchema } from "./schemas";

/**
 * Domain-specific ID types based on UUID
 * 
 * Each ID type is a branded UUID for type safety.
 * These prevent mixing up different entity IDs at compile time.
 */

// =============================================================================
// ID Type Definitions
// =============================================================================

export type UserId = string & Brand.Brand<"UUID"> & Brand.Brand<"UserId">;
export type TaskId = string & Brand.Brand<"UUID"> & Brand.Brand<"TaskId">;

// =============================================================================
// ID Schemas
// =============================================================================

/**
 * UserId schema - combines UUID validation with UserId branding
 */
export const UserIdSchema = UUIDSchema.pipe(S.brand("UserId"));

/**
 * TaskId schema - combines UUID validation with TaskId branding
 */
export const TaskIdSchema = UUIDSchema.pipe(S.brand("TaskId"));

// =============================================================================
// ID Constructors
// =============================================================================

/**
 * Nominal constructors for trusted ID values (no validation)
 */
const UserIdNominal = Brand.nominal<UserId>();
const TaskIdNominal = Brand.nominal<TaskId>();

/**
 * UserId helpers
 */
export const UserId = {
  /**
   * Create a UserId from a trusted UUID string (no validation)
   */
  fromTrusted: (s: string): UserId => UserIdNominal(s as any)
};

/**
 * TaskId helpers
 */
export const TaskId = {
  /**
   * Create a TaskId from a trusted UUID string (no validation)
   */
  fromTrusted: (s: string): TaskId => TaskIdNominal(s as any)
};
