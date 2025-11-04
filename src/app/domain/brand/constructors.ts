import { randomUUID } from "node:crypto";
import { Brand } from "effect";
import type { UUID as UUIDType, Email as EmailType, DateTime as DateTimeType } from "./types";

/**
 * Brand constructors and thin domain helpers for creating branded values.
 * 
 * Constructors validate input and return branded types.
 * Trusted constructors bypass validation for known-good values.
 * 
 * References:
 * - https://effect.website/docs/code-style/branded-types/
 */

// =============================================================================
// UUID
// =============================================================================

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Brand constructor for UUID with validation
 */
const UUIDBrand = Brand.refined<UUIDType>(
  (input): input is string & UUIDType => {
    return typeof input === "string" && UUID_PATTERN.test(input);
  },
  (input) => Brand.error(`Expected valid UUID, got: ${input}`)
);

/**
 * Nominal constructor for trusted UUID values (no validation)
 */
const UUIDNominal = Brand.nominal<UUIDType>();

/**
 * UUID helpers namespace
 */
export const UUID = {
  /**
   * Create a UUID from untrusted input with validation
   * @throws BrandErrors if validation fails
   */
  make: UUIDBrand,

  /**
   * Create a UUID from a trusted string (no validation)
   * Use only when you're certain the input is a valid UUID
   */
  fromTrusted: (s: string): UUIDType => UUIDNominal(s),

  /**
   * Generate a new random UUID
   * Nominal is a constructor that creates a new UUID.
   */
  init: (): UUIDType => UUIDNominal(randomUUID()), 

  isValid: (s: string): boolean => typeof s === "string" && UUID_PATTERN.test(s)

};

// =============================================================================
// Email
// =============================================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Brand constructor for Email with validation
 */
const EmailBrand = Brand.refined<EmailType>(
  (input): input is string & EmailType => {
    return typeof input === "string" && EMAIL_PATTERN.test(input);
  },
  (input) => Brand.error(`Expected valid email, got: ${input}`)
);

/**
 * Nominal constructor for trusted Email values (no validation)
 */
const EmailNominal = Brand.nominal<EmailType>();

/**
 * Email helpers namespace
 */
export const Email = {
  /**
   * Create an Email from untrusted input with validation
   * @throws BrandErrors if validation fails
   */
  make: EmailBrand,

  /**
   * Create an Email from a trusted string (no validation)
   * Use only when you're certain the input is a valid email
   */
  fromTrusted: (s: string): EmailType => EmailNominal(s)
};

// =============================================================================
// DateTime
// =============================================================================

/**
 * Brand constructor for DateTime with validation
 */
const DateTimeBrand = Brand.refined<DateTimeType>(
  (input): input is Date & DateTimeType => {
    return input instanceof Date && !isNaN(input.getTime());
  },
  (input) => Brand.error(`Expected valid Date, got: ${input}`)
);

/**
 * Nominal constructor for trusted DateTime values (no validation)
 */
const DateTimeNominal = Brand.nominal<DateTimeType>();

/**
 * DateTime helpers namespace
 */
export const DateTime = {
  /**
   * Create a DateTime from an ISO string
   * @throws BrandErrors if parsing fails
   */
  makeFromIso: (s: string): DateTimeType => {
    const date = new Date(s);
    return DateTimeBrand(date);
  },

  /**
   * Create a DateTime from epoch seconds
   * @throws BrandErrors if conversion fails
   */
  makeFromEpochSeconds: (n: number): DateTimeType => {
    const date = new Date(n * 1000);
    return DateTimeBrand(date);
  },

  /**
   * Create a DateTime from epoch milliseconds
   * @throws BrandErrors if conversion fails
   */
  makeFromEpochMillis: (n: number): DateTimeType => {
    const date = new Date(n);
    return DateTimeBrand(date);
  },

  /**
   * Create a DateTime from a trusted Date (no validation)
   * Use only when you're certain the input is a valid Date
   */
  fromTrusted: (d: Date): DateTimeType => DateTimeNominal(d),

  /**
   * Get the current DateTime
   */
  now: (): DateTimeType => DateTimeNominal(new Date()),

  /**
   * Convert DateTime to ISO string
   */
  toISOString: (dt: DateTimeType): string => dt.toISOString(),

  /**
   * Convert DateTime to epoch seconds
   */
  toEpochSeconds: (dt: DateTimeType): number => Math.floor(dt.getTime() / 1000),

  /**
   * Convert DateTime to epoch milliseconds
   */
  toEpochMillis: (dt: DateTimeType): number => dt.getTime()
};

