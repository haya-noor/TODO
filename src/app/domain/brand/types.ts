import type { Brand } from "effect";

/**
 * Branded domain types using Effect Brand for nominal typing.
 * These types provide compile-time type safety without runtime overhead.
 * 
 * References:
 * - https://effect.website/docs/code-style/branded-types/
 */

/**
 * UUID - Universally Unique Identifier
 * Domain representation: branded string
 */
export type UUID = string & Brand.Brand<"UUID">;

/**
 * Email - Valid email address
 * Domain representation: branded string
 */
export type Email = string & Brand.Brand<"Email">;

/**
 * DateTime - Temporal instant
 * Domain representation: branded Date
 * Wire formats: ISO string or epoch seconds (via transformers)
 */
export type DateTime = Date & Brand.Brand<"DateTime">;

