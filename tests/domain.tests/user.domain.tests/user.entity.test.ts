import { describe, it, expect } from "vitest";
import { Effect as E } from "effect";
import * as fc from "fast-check";
import { User } from "@/app/domain/user/user.entity";
import { UserId } from "@/app/domain/brand/ids";
import { UserValidationError } from "@/app/domain/user/user.errors";
import { UserSchema } from "@/app/domain/user/user.schema";
import { SerializedUser } from "@/app/domain/user/user.schema"; 

import {
  TestDataGenerator,
  serializedUserArbitrary,
  validNameArbitrary,
  validEmailArbitrary,
  validPasswordArbitrary,
  invalidNameArbitrary,
  invalidEmailArbitrary,
  invalidPasswordArbitrary,
} from "../../test.data";


describe("User Entity", () => {
  describe("User.create()", () => {
    it("should create a user with valid data using faker", async () => {
      const userData = TestDataGenerator.generateValidUser();

      const result = await E.runPromise(User.create(userData));

      expect(result).toBeInstanceOf(User);
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
      expect(result.password).toBe(userData.password);
      expect(result.id).toBe(userData.id);
    });

    it("should create multiple users with different data", async () => {
      const users = TestDataGenerator.generateUsers(10);

      const results = await Promise.all(
        users.map((userData) => E.runPromise(User.create(userData)))
      );

      expect(results).toHaveLength(10);
      results.forEach((user, index) => {
        expect(user.name).toBe(users[index].name);
        expect(user.email).toBe(users[index].email);
      });
    });

    it("should fail with UserValidationError for empty name", async () => {
      const invalidUser = TestDataGenerator.generateInvalidUser("name");

      await expect(E.runPromise(User.create(invalidUser as any))).rejects.toThrow();
    });

    it("should fail with UserValidationError for invalid email (too long)", async () => {
      const invalidUser = TestDataGenerator.generateInvalidUser("email");

      await expect(E.runPromise(User.create(invalidUser as any))).rejects.toThrow();
    });

    it("should fail with UserValidationError for empty password", async () => {
      const invalidUser = TestDataGenerator.generateInvalidUser("password");

      await expect(E.runPromise(User.create(invalidUser as any))).rejects.toThrow();
    });

    // Property-based test: all valid users should create successfully
    it("should create user for any valid input (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(serializedUserArbitrary, async (userData) => {
          const result = await E.runPromise(User.create(userData));
          expect(result).toBeInstanceOf(User);
          expect(result.name).toBe(userData.name);
          expect(result.email).toBe(userData.email);
          expect(result.password).toBe(userData.password);
        }),
        { numRuns: 100 }
      );
    });

    // Property-based test: invalid names should fail
    it("should fail for any invalid name (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          invalidNameArbitrary,
          validEmailArbitrary,
          validPasswordArbitrary,
          async (name, email, password) => {
            const userData = {
              ...TestDataGenerator.generateValidUser(),
              name,
              email,
              password,
            };

            await expect(E.runPromise(User.create(userData))).rejects.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    // Property-based test: invalid emails should fail
    it("should fail for any invalid email (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          validNameArbitrary,
          invalidEmailArbitrary,
          validPasswordArbitrary,
          async (name, email, password) => {
            const userData = {
              ...TestDataGenerator.generateValidUser(),
              name,
              email,
              password,
            };

            await expect(E.runPromise(User.create(userData))).rejects.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    // Property-based test: invalid passwords should fail
    it("should fail for any invalid password (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          validNameArbitrary,
          validEmailArbitrary,
          invalidPasswordArbitrary,
          async (name, email, password) => {
            const userData = {
              ...TestDataGenerator.generateValidUser(),
              name,
              email,
              password,
            };

            await expect(E.runPromise(User.create(userData))).rejects.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("User.serialized()", () => {
    it("should serialize user back to original data", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      const serialized = await E.runPromise(user.serialized());

      expect(serialized.name).toBe(userData.name);
      expect(serialized.email).toBe(userData.email);
      expect(serialized.password).toBe(userData.password);
      expect(serialized.id).toBe(userData.id);
    });

    it("should maintain serialization consistency (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(serializedUserArbitrary, async (userData) => {
          const user = await E.runPromise(User.create(userData));
          const serialized = await E.runPromise(user.serialized());

          expect(serialized.name).toBe(userData.name);
          expect(serialized.email).toBe(userData.email);
          expect(serialized.password).toBe(userData.password);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("User.updateName()", () => {
    it("should update name with valid value", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const newName = TestDataGenerator.generateValidUser().name;

      const updatedUser = await E.runPromise(user.updateName(newName));

      expect(updatedUser).toBeInstanceOf(User);
      expect(updatedUser.name).toBe(newName);
      expect(updatedUser.email).toBe(userData.email);
      expect(updatedUser.password).toBe(userData.password);
      expect(updatedUser.id).toBe(userData.id);
    });

    it("should fail with invalid name (empty)", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      await expect(E.runPromise(user.updateName(""))).rejects.toThrow();
    });

    it("should fail with invalid name (too long)", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const tooLongName = "a".repeat(256);

      await expect(E.runPromise(user.updateName(tooLongName))).rejects.toThrow();
    });

    it("should update name with any valid value (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          serializedUserArbitrary,
          validNameArbitrary,
          async (userData, newName) => {
            const user = await E.runPromise(User.create(userData));
            const updatedUser = await E.runPromise(user.updateName(newName));

            expect(updatedUser.name).toBe(newName);
            expect(updatedUser.email).toBe(userData.email);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("User.updateEmail()", () => {
    it("should update email with valid value", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const newEmail = TestDataGenerator.generateValidUser().email;

      const updatedUser = await E.runPromise(user.updateEmail(newEmail));

      expect(updatedUser).toBeInstanceOf(User);
      expect(updatedUser.email).toBe(newEmail);
      expect(updatedUser.name).toBe(userData.name);
      expect(updatedUser.password).toBe(userData.password);
    });

    it("should fail with invalid email (empty)", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      await expect(E.runPromise(user.updateEmail(""))).rejects.toThrow();
    });

    it("should fail with invalid email (too long)", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const tooLongEmail = "a".repeat(256);

      await expect(E.runPromise(user.updateEmail(tooLongEmail))).rejects.toThrow();
    });

    it("should update email with any valid value (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          serializedUserArbitrary,
          validEmailArbitrary,
          async (userData, newEmail) => {
            const user = await E.runPromise(User.create(userData));
            const updatedUser = await E.runPromise(user.updateEmail(newEmail));

            expect(updatedUser.email).toBe(newEmail);
            expect(updatedUser.name).toBe(userData.name);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("User.updatePassword()", () => {
    it("should update password with valid value", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const newPassword = TestDataGenerator.generateValidUser().password;

      const updatedUser = await E.runPromise(user.updatePassword(newPassword));

      expect(updatedUser).toBeInstanceOf(User);
      expect(updatedUser.password).toBe(newPassword);
      expect(updatedUser.name).toBe(userData.name);
      expect(updatedUser.email).toBe(userData.email);
    });

    it("should fail with invalid password (empty)", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      await expect(E.runPromise(user.updatePassword(""))).rejects.toThrow();
    });

    it("should fail with invalid password (too long)", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const tooLongPassword = "a".repeat(256);

      await expect(E.runPromise(user.updatePassword(tooLongPassword))).rejects.toThrow();
    });

    it("should update password with any valid value (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          serializedUserArbitrary,
          validPasswordArbitrary,
          async (userData, newPassword) => {
            const user = await E.runPromise(User.create(userData));
            const updatedUser = await E.runPromise(user.updatePassword(newPassword));

            expect(updatedUser.password).toBe(newPassword);
            expect(updatedUser.email).toBe(userData.email);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("User.hasId()", () => {
    it("should return true for matching user ID", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      const hasId = user.hasId(UserId.fromTrusted(userData.id));

      expect(hasId).toBe(true);
    });

    it("should return false for non-matching user ID", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const differentId = UserId.fromTrusted(TestDataGenerator.generateValidUser().id);

      const hasId = user.hasId(differentId);

      expect(hasId).toBe(false);
    });

    it("should correctly identify user ID (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(serializedUserArbitrary, async (userData) => {
          const user = await E.runPromise(User.create(userData));
          expect(user.hasId(UserId.fromTrusted(userData.id))).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("User.hasEmail()", () => {
    it("should return true for matching email (case insensitive)", async () => {
      const userData = TestDataGenerator.generateValidUser({
        email: "test@example.com",
      });
      const user = await E.runPromise(User.create(userData));

      expect(user.hasEmail("test@example.com")).toBe(true);
      expect(user.hasEmail("TEST@EXAMPLE.COM")).toBe(true);
      expect(user.hasEmail("TeSt@ExAmPlE.CoM")).toBe(true);
    });

    it("should return false for non-matching email", async () => {
      const userData = TestDataGenerator.generateValidUser({
        email: "test@example.com",
      });
      const user = await E.runPromise(User.create(userData));

      expect(user.hasEmail("other@example.com")).toBe(false);
    });

    it("should correctly identify email case-insensitively (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(serializedUserArbitrary, async (userData) => {
          const user = await E.runPromise(User.create(userData));
          expect(user.hasEmail(userData.email)).toBe(true);
          expect(user.hasEmail(userData.email.toLowerCase())).toBe(true);
          expect(user.hasEmail(userData.email.toUpperCase())).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("User immutability", () => {
    it("should create new instance on updates (immutability)", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const newName = TestDataGenerator.generateValidUser().name;

      const updatedUser = await E.runPromise(user.updateName(newName));

      expect(user).not.toBe(updatedUser);
      expect(user.name).toBe(userData.name);
      expect(updatedUser.name).toBe(newName);
    });

    it("should maintain immutability across multiple updates", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user1 = await E.runPromise(User.create(userData));
      const user2 = await E.runPromise(user1.updateName("New Name"));
      const user3 = await E.runPromise(user2.updateEmail("new@email.com"));

      expect(user1.name).toBe(userData.name);
      expect(user2.name).toBe("New Name");
      expect(user3.name).toBe("New Name");
      expect(user1.email).toBe(userData.email);
      expect(user2.email).toBe(userData.email);
      expect(user3.email).toBe("new@email.com");
    });
  });
});

