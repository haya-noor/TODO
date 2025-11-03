import { Option as O } from "effect";

// Import SQL query helper functions from drizzle-orm
import { or, like, SQL } from "drizzle-orm";

// Import type for any valid column in drizzle-orm
import type { AnyColumn } from "drizzle-orm";

/**
 * Query Builders - Simple, reusable query utilities
 */

/**
Build text search filter (searches across multiple columns)
  columns: AnyColumn[],       // List of columns to search in
  searchText?: string         // Optional search text
): O.Option<SQL> =>           // Returns an Option-wrapped SQL condition
  O.fromNullable(searchText).pipe(           // Convert nullable searchText into Option
    O.map((text) => {                        // If present, transform it
      const pattern = `%${text}%`;           // Create SQL LIKE pattern for partial match
      const conditions = columns.map((col) => like(col, pattern)); // Build `like` condition for each column
      return or(...conditions)!;             // Combine all conditions using OR; assert non-null
    })
  ); 
 */
export const buildTextSearchFilter = (
  columns: AnyColumn[],
  searchText?: string
): O.Option<SQL> =>
  O.fromNullable(searchText).pipe(
    O.map((text) => {
      const pattern = `%${text}%`;
      const conditions = columns.map((col) => like(col, pattern));
      return or(...conditions)!;
    })
  );

/**
 * Flatten Option conditions into array of SQL conditions
 */
export const flattenConditions = (conditions: O.Option<SQL>[]): SQL[] =>
    // Flatten the Option conditions into an array 
  conditions.flatMap((optionCondition) =>
    // If the condition is Some, return the value, otherwise return an empty array
    O.isSome(optionCondition) ? [optionCondition.value] : []
  );

/**
 * Calculate pagination offset
 */
export const calculateOffset = (page: number, limit: number): number =>
// offset is (current page - 1) * limit (items per page)
  (page - 1) * limit;

/**
 * Build pagination metadata
 */
export const buildPaginationMeta = (
  page: number,   // current page
  limit: number,   // items per page
  total: number   // total items
) => {
  // total pages is the total number of pages needed to display all items
  const totalPages = Math.ceil(total / limit);
  // return the pagination metadata
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

