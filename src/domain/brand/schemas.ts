import { ParseResult, Schema as S } from "effect";
import type { UUID, Email, DateTime } from "./types";

/**
 * Effect Schema definitions for branded types with transformers.
 * 
 * These schemas handle validation and encoding/decoding at boundaries:
 * - Domain type: branded (UUID, Email, DateTime)
 * - Wire/DB type: primitive (string, number, Date)
 * 
 * References:
 * - https://effect.website/docs/schema/advanced-usage/#branded-types
 */

// =============================================================================
// UUID Schemas
// =============================================================================

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Base UUID schema with brand
 * Domain type: UUID (branded string)
 */
export const UUIDSchema = S.String.pipe(
  S.pattern(UUID_PATTERN, {
    message: () => "Invalid UUID format"
  }),
  S.brand("UUID")
);

/**
 * Transform string to UUID with validation
 * Input: string, Output: UUID
 */
export const UUIDFromString = S.transformOrFail(
  S.String,
  UUIDSchema,
  {
    strict: true,
    decode: (input, _, ast) => {
      if (!UUID_PATTERN.test(input)) {
        return ParseResult.fail(
          new ParseResult.Type(ast, input, `Invalid UUID format: ${input}`)
        );
      }
      return ParseResult.succeed(input as UUID);
    },
    encode: (uuid) => ParseResult.succeed(uuid as string)
  }
);

// =============================================================================
// Email Schemas
// =============================================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Base Email schema with brand
 * Domain type: Email (branded string)
 */
export const EmailSchema = S.String.pipe(
  S.pattern(EMAIL_PATTERN, {
    message: () => "Invalid email format"
  }),
  S.brand("Email")
);

/**
 * Transform string to Email with validation
 * Input: string, Output: Email
 */
export const EmailFromString = S.transformOrFail(
  S.String,
  EmailSchema,
  {
    strict: true,
    decode: (input, _, ast) => {
      if (!EMAIL_PATTERN.test(input)) {
        return ParseResult.fail(
          new ParseResult.Type(ast, input, `Invalid email format: ${input}`)
        );
      }
      return ParseResult.succeed(input as Email);
    },
    encode: (email) => ParseResult.succeed(email as string)
  }
);

// =============================================================================
// DateTime Schemas
// =============================================================================

/**
 * Base DateTime schema with brand
 * Domain type: DateTime (branded Date)
 * Both Type and Encoded are Date (use DateFromSelf to avoid string encoding)
 */
export const DateTimeSchema = S.DateFromSelf.pipe(
  S.filter((date): date is Date => !isNaN(date.getTime()), {
    message: () => "Invalid date"
  }),
  S.brand("DateTime")
);

/**
 * Transform ISO string to DateTime
 * Input: ISO string, Output: DateTime (branded Date)
 * Encode: DateTime -> ISO string
 * 
 * Use for HTTP/JSON APIs
 */
export const DateTimeFromIsoString = S.transformOrFail(
  S.String,
  DateTimeSchema,
  {
    strict: true,
    decode: (input, options, ast) => {
      const date = new Date(input);
      if (isNaN(date.getTime())) {
        return ParseResult.fail(
          new ParseResult.Type(ast, input, `Invalid ISO date string: ${input}`)
        );
      }
      return ParseResult.succeed(date as DateTime);
    },
    encode: (dateTime, options, ast) => {
      return ParseResult.succeed((dateTime as unknown as Date).toISOString());
    }
  }
);

/**
 * Transform epoch seconds to DateTime
 * Input: number (seconds since epoch), Output: DateTime (branded Date)
 * Encode: DateTime -> epoch seconds
 * 
 * Use for database storage or Unix timestamps
 */
export const DateTimeFromEpochSeconds = S.transformOrFail(
  S.Number,
  DateTimeSchema,
  {
    strict: true,
    decode: (input, options, ast) => {
      // Convert seconds to milliseconds
      const date = new Date(input * 1000);
      if (isNaN(date.getTime())) {
        return ParseResult.fail(
          new ParseResult.Type(ast, input, `Invalid epoch seconds: ${input}`)
        );
      }
      return ParseResult.succeed(date as DateTime);
    },
    encode: (dateTime, options, ast) => {
      // Convert milliseconds to seconds
      const seconds = Math.floor((dateTime as unknown as Date).getTime() / 1000);
      return ParseResult.succeed(seconds);
    }
  }
);

/**
 * Transform epoch milliseconds to DateTime
 * Input: number (milliseconds since epoch), Output: DateTime (branded Date)
 * Encode: DateTime -> epoch milliseconds
 * 
 * Use when working with JavaScript timestamps
 */
export const DateTimeFromEpochMillis = S.transformOrFail(
  S.Number,
  DateTimeSchema,
  {
    strict: true,
    decode: (input, options, ast) => {
      const date = new Date(input);
      if (isNaN(date.getTime())) {
        return ParseResult.fail(
          new ParseResult.Type(ast, input, `Invalid epoch milliseconds: ${input}`)
        );
      }
      return ParseResult.succeed(date as DateTime);
    },
    encode: (dateTime, options, ast) => {
      return ParseResult.succeed((dateTime as unknown as Date).getTime());
    }
  }
);

/**
 * Transform Date to DateTime (for when you receive a Date from external sources)
 * Input: Date, Output: DateTime (branded Date)
 */
export const DateTimeFromDate = S.transformOrFail(
  S.Date,
  DateTimeSchema,
  {
    strict: true,
    decode: (input, options, ast) => {
      if (isNaN(input.getTime())) {
        return ParseResult.fail(
          new ParseResult.Type(ast, input, `Invalid Date object`)
        );
      }
      return ParseResult.succeed(input as DateTime);
    },
    encode: (dateTime, options, ast) => {
      return ParseResult.succeed(dateTime as unknown as Date);
    }
  }
);

/**
 * Union transformer accepting ISO string, epoch seconds, or Date
 * Decodes any of these formats to DateTime
 * Encodes DateTime to ISO string by default
 * 
 * Use when you need flexible input handling
 */
export const DateTimeFromAny = S.Union(
  DateTimeFromIsoString,
  DateTimeFromEpochSeconds,
  DateTimeFromDate
);

