import { describe, it, expect } from "vitest";
import { Schema as S, Effect as E } from "effect";
import * as fc from "fast-check";
import { UserGuards } from "@domain/user/user.guards";
import {
  validNameArbitrary,
  validEmailArbitrary,
  validPasswordArbitrary,
  invalidNameArbitrary,
  invalidEmailArbitrary,
  invalidPasswordArbitrary,
} from "../../test.data";
import { faker } from "@faker-js/faker";

describe("User Guards", () => {
  describe("UserGuards.validateName", () => {
    it("should accept valid names (1-255 characters)", async () => {
      const validNames = [
        "A",
        "AB",
        "John Doe",
        "A".repeat(255),
        "Jane Smith",
      ];

      for (const name of validNames) {
        const schema = S.String.pipe(UserGuards.validateName);
        const result = await E.runPromise(S.decodeUnknown(schema)(name));
        expect(result).toBe(name);
      }
    });

    it("should reject empty name", async () => {
      const schema = S.String.pipe(UserGuards.validateName);
      await expect(E.runPromise(S.decodeUnknown(schema)(""))).rejects.toThrow();
    });

    it("should reject name longer than 255 characters", async () => {
      const schema = S.String.pipe(UserGuards.validateName);
      const longName = "A".repeat(256);
      await expect(E.runPromise(S.decodeUnknown(schema)(longName))).rejects.toThrow();
    });

    it("should accept any valid name length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(validNameArbitrary, async (name) => {
          const schema = S.String.pipe(UserGuards.validateName);
          const result = await E.runPromise(S.decodeUnknown(schema)(name));
          expect(result).toBe(name);
          expect(name.length).toBeGreaterThan(0);
          expect(name.length).toBeLessThan(256);
        }),
        { numRuns: 200 }
      );
    });

    it("should reject any invalid name length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(invalidNameArbitrary, async (name) => {
          const schema = S.String.pipe(UserGuards.validateName);
          await expect(E.runPromise(S.decodeUnknown(schema)(name))).rejects.toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("UserGuards.validateEmail", () => {
    it("should accept valid emails (1-255 characters)", async () => {
      const validEmails = [
        faker.internet.email(),
        "a@b.c",
        "test@example.com",
        "A".repeat(240) + "@test.com",
      ];

      for (const email of validEmails) {
        const schema = S.String.pipe(UserGuards.validateEmail);
        const result = await E.runPromise(S.decodeUnknown(schema)(email));
        expect(result).toBe(email);
      }
    });

    it("should reject empty email", async () => {
      const schema = S.String.pipe(UserGuards.validateEmail);
      await expect(E.runPromise(S.decodeUnknown(schema)(""))).rejects.toThrow();
    });

    it("should reject email longer than 255 characters", async () => {
      const schema = S.String.pipe(UserGuards.validateEmail);
      const longEmail = "A".repeat(256);
      await expect(E.runPromise(S.decodeUnknown(schema)(longEmail))).rejects.toThrow();
    });

    it("should accept any valid email length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(validEmailArbitrary, async (email) => {
          const schema = S.String.pipe(UserGuards.validateEmail);
          const result = await E.runPromise(S.decodeUnknown(schema)(email));
          expect(result).toBe(email);
          expect(email.length).toBeGreaterThan(0);
          expect(email.length).toBeLessThan(256);
        }),
        { numRuns: 200 }
      );
    });

    it("should reject any invalid email length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(invalidEmailArbitrary, async (email) => {
          const schema = S.String.pipe(UserGuards.validateEmail);
          await expect(E.runPromise(S.decodeUnknown(schema)(email))).rejects.toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("UserGuards.validatePassword", () => {
    it("should accept valid passwords (1-255 characters)", async () => {
      const validPasswords = [
        "A",
        "AB",
        "password123",
        "A".repeat(255),
        "SecureP@ssw0rd!",
      ];

      for (const password of validPasswords) {
        const schema = S.String.pipe(UserGuards.validatePassword);
        const result = await E.runPromise(S.decodeUnknown(schema)(password));
        expect(result).toBe(password);
      }
    });

    it("should reject empty password", async () => {
      const schema = S.String.pipe(UserGuards.validatePassword);
      await expect(E.runPromise(S.decodeUnknown(schema)(""))).rejects.toThrow();
    });

    it("should reject password longer than 255 characters", async () => {
      const schema = S.String.pipe(UserGuards.validatePassword);
      const longPassword = "A".repeat(256);
      await expect(
        E.runPromise(S.decodeUnknown(schema)(longPassword))
      ).rejects.toThrow();
    });

    it("should accept any valid password length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(validPasswordArbitrary, async (password) => {
          const schema = S.String.pipe(UserGuards.validatePassword);
          const result = await E.runPromise(S.decodeUnknown(schema)(password));
          expect(result).toBe(password);
          expect(password.length).toBeGreaterThan(0);
          expect(password.length).toBeLessThan(256);
        }),
        { numRuns: 200 }
      );
    });

    it("should reject any invalid password length (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(invalidPasswordArbitrary, async (password) => {
          const schema = S.String.pipe(UserGuards.validatePassword);
          await expect(
            E.runPromise(S.decodeUnknown(schema)(password))
          ).rejects.toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle boundary values correctly", async () => {
      const nameSchema = S.String.pipe(UserGuards.validateName);

      // Exactly 1 character - valid
      await expect(E.runPromise(S.decodeUnknown(nameSchema)("A"))).resolves.toBe("A");

      // Exactly 255 characters - valid
      const name255 = "A".repeat(255);
      await expect(
        E.runPromise(S.decodeUnknown(nameSchema)(name255))
      ).resolves.toBe(name255);

      // Exactly 256 characters - invalid
      const name256 = "A".repeat(256);
      await expect(E.runPromise(S.decodeUnknown(nameSchema)(name256))).rejects.toThrow();

      // 0 characters - invalid
      await expect(E.runPromise(S.decodeUnknown(nameSchema)(""))).rejects.toThrow();
    });

    it("should handle special characters in names", async () => {
      const schema = S.String.pipe(UserGuards.validateName);
      const specialNames = [
        "Jean-Claude Van Damme",
        "O'Connor",
        "José García",
        "Müller",
        "李明",
        "Владимир",
      ];

      for (const name of specialNames) {
        const result = await E.runPromise(S.decodeUnknown(schema)(name));
        expect(result).toBe(name);
      }
    });

    it("should handle unicode characters", async () => {
      const schema = S.String.pipe(UserGuards.validateName);
      const unicodeNames = [
        "Party",
        "Test™",
        "Café",
        "Zürich",
      ];

      for (const name of unicodeNames) {
        const result = await E.runPromise(S.decodeUnknown(schema)(name));
        expect(result).toBe(name);
      }
    });
  });
});
