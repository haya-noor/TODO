import { faker } from "@faker-js/faker";
import * as fc from "fast-check";
import type { UserId, TaskId } from "@domain/brand/ids";
import { UserId as UserIdHelper, TaskId as TaskIdHelper } from "@domain/brand/ids";
import type { SerializedUser } from "@domain/user/user.schema";
import type { SerializedTask } from "@domain/task/task.schema";

/**
 * Fast-check arbitraries for generating random test data
 */

// UUID arbitrary
export const uuidArbitrary = fc.uuid();

// User ID arbitrary
export const userIdArbitrary = fc.uuid().map((uuid) => UserIdHelper.fromTrusted(uuid));

// Task ID arbitrary
export const taskIdArbitrary = fc.uuid().map((uuid) => TaskIdHelper.fromTrusted(uuid));

// Valid name arbitrary (1-255 characters, alphanumeric with spaces)
export const validNameArbitrary = fc
  .stringMatching(/^[a-zA-Z0-9 ]{1,255}$/)
  .filter((s) => s.trim().length > 0);

// Valid email arbitrary (1-255 characters, simplified)
export const validEmailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/),
    fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/),
    fc.stringMatching(/^[a-zA-Z]{2,10}$/)
  )
  .map(([user, domain, tld]) => `${user}@${domain}.${tld}`)
  .filter((email) => email.length <= 255);

// Valid password arbitrary (1-255 characters, printable ASCII)
export const validPasswordArbitrary = fc
  .stringMatching(/^[\x21-\x7E]{1,255}$/);

// Invalid name arbitrary (empty or > 255 characters)
export const invalidNameArbitrary = fc.oneof(
  fc.constant(""),
  fc.string({ minLength: 256, maxLength: 300 })
);

// Invalid email arbitrary (empty or > 255 characters)
export const invalidEmailArbitrary = fc.oneof(
  fc.constant(""),
  fc.string({ minLength: 256, maxLength: 300 })
);

// Invalid password arbitrary (empty or > 255 characters)
export const invalidPasswordArbitrary = fc.oneof(
  fc.constant(""),
  fc.string({ minLength: 256, maxLength: 300 })
);

// Valid title arbitrary (1-255 characters, non-empty content)
export const validTitleArbitrary = fc
  .stringMatching(/^[a-zA-Z0-9 .,!?-]{1,255}$/)
  .filter((s) => s.trim().length > 0);

// Invalid title arbitrary (empty or > 255 characters)
export const invalidTitleArbitrary = fc.oneof(
  fc.constant(""),
  fc.string({ minLength: 256, maxLength: 300 })
);

// Valid description arbitrary (50-1000 characters, non-empty content)
export const validDescriptionArbitrary = fc
  .stringMatching(/^[a-zA-Z0-9 .,!?\n-]{50,1000}$/)
  .filter((s) => s.trim().length >= 50);

// Invalid description arbitrary (< 50 or > 1000 characters)
export const invalidDescriptionArbitrary = fc.oneof(
  fc.string({ minLength: 0, maxLength: 49 }),
  fc.string({ minLength: 1001, maxLength: 1100 })
);

// Task status arbitrary
export const taskStatusArbitrary = fc.constantFrom("TODO", "IN_PROGRESS", "DONE");

// Date arbitrary - constrained to valid dates only (no NaN or invalid dates)
// Using integer timestamps to ensure valid dates and filtering out NaN
export const dateArbitrary = fc
  .integer({ min: 0, max: 4102444799999 }) // 1970 to 2099 in milliseconds
  .map((timestamp) => new Date(timestamp))
  .filter((date) => !isNaN(date.getTime())); // Extra safety: filter out any NaN dates

/**
 * Faker-based generators for creating realistic test data
 */

export class TestDataGenerator {
  /**
   * Generate a valid SerializedUser using faker
   */
  static generateValidUser(overrides?: Partial<SerializedUser>): SerializedUser {
    const now = new Date();
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * Generate a valid SerializedTask using faker
   */
  static generateValidTask(overrides?: Partial<SerializedTask>): SerializedTask {
    const now = new Date();
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence({ min: 3, max: 10 }),
      description: faker.lorem.paragraphs(2),
      status: faker.helpers.arrayElement(["TODO", "IN_PROGRESS", "DONE"] as const),
      assigneeId: faker.string.uuid(),
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * Generate an invalid user with specific field violations
   */
  static generateInvalidUser(violation: "name" | "email" | "password"): Partial<SerializedUser> {
    const base = this.generateValidUser();
    switch (violation) {
      case "name":
        return { ...base, name: "" };
      case "email":
        return { ...base, email: "a".repeat(256) };
      case "password":
        return { ...base, password: "" };
    }
  }

  /**
   * Generate an invalid task with specific field violations
   */
  static generateInvalidTask(violation: "title" | "description"): Partial<SerializedTask> {
    const base = this.generateValidTask();
    switch (violation) {
      case "title":
        return { ...base, title: "" };
      case "description":
        return { ...base, description: "short" }; // Less than 50 characters
    }
  }

  /**
   * Generate multiple valid users
   */
  static generateUsers(count: number): SerializedUser[] {
    return Array.from({ length: count }, () => this.generateValidUser());
  }

  /**
   * Generate multiple valid tasks
   */
  static generateTasks(count: number, assigneeId?: string): SerializedTask[] {
    return Array.from({ length: count }, () =>
      this.generateValidTask(assigneeId ? { assigneeId } : {})
    );
  }
}

/**
 * Fast-check arbitrary for complete SerializedUser
 */
export const serializedUserArbitrary: fc.Arbitrary<SerializedUser> = fc.record({
  id: uuidArbitrary,
  name: validNameArbitrary,
  email: validEmailArbitrary,
  password: validPasswordArbitrary,
  createdAt: dateArbitrary,
  updatedAt: dateArbitrary,
});

/**
 * Fast-check arbitrary for complete SerializedTask
 */
export const serializedTaskArbitrary: fc.Arbitrary<SerializedTask> = fc.record({
  id: uuidArbitrary,
  title: validTitleArbitrary,
  description: fc.oneof(validDescriptionArbitrary, fc.constant(undefined)),
  status: taskStatusArbitrary,
  assigneeId: uuidArbitrary,
  createdAt: dateArbitrary,
  updatedAt: dateArbitrary,
});

