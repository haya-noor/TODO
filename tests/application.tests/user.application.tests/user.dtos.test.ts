import { describe, it, expect } from "vitest";
import { Effect as E, Schema as S } from "effect";
import * as fc from "fast-check";
import {
  CreateUserDtoSchema,
  UpdateUserDtoSchema,
  RemoveUserDtoSchema,
  UserBasicViewDtoSchema,
} from "../../../src/app/application/user/user.dtos";
import { TestDataGenerator } from "../../test.data";

describe("User DTOs", () => {
  describe("CreateUserDtoSchema", () => {
    it("should validate valid create user DTO", async () => {
      const input = {
        name: "John Doe",
        email: "john@example.com",
        password: "securePassword123",
      };

      const result = await E.runPromise(
        S.decodeUnknown(CreateUserDtoSchema)(input)
      );

      expect(result).toEqual(input);
    });

    it("should reject DTO with missing name", async () => {
      const input = {
        email: "john@example.com",
        password: "securePassword123",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with missing email", async () => {
      const input = {
        name: "John Doe",
        password: "securePassword123",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with missing password", async () => {
      const input = {
        name: "John Doe",
        email: "john@example.com",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with empty name", async () => {
      const input = {
        name: "",
        email: "john@example.com",
        password: "securePassword123",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with empty password", async () => {
      const input = {
        name: "John Doe",
        email: "john@example.com",
        password: "",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with name > 255 characters", async () => {
      const input = {
        name: "a".repeat(256),
        email: "john@example.com",
        password: "securePassword123",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    // Note: .pick() doesn't reject extra fields by default, it just ignores them
    // This is the expected behavior in Effect Schema
  });

  describe("UpdateUserDtoSchema", () => {
    it("should validate valid update user DTO with all fields", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Jane Doe",
        email: "jane@example.com",
        password: "newPassword456",
      };

      const result = await E.runPromise(
        S.decodeUnknown(UpdateUserDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
      expect(result.name).toBe(input.name);
      expect(result.email).toBe(input.email);
      expect(result.password).toBe(input.password);
    });

    it("should validate update DTO with only id and name", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Jane Doe",
      };

      const result = await E.runPromise(
        S.decodeUnknown(UpdateUserDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
      expect(result.name).toBe(input.name);
      expect(result.email).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    it("should validate update DTO with only id and email", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "newemail@example.com",
      };

      const result = await E.runPromise(
        S.decodeUnknown(UpdateUserDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
      expect(result.email).toBe(input.email);
      expect(result.name).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    it("should validate update DTO with only id (no updates)", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = await E.runPromise(
        S.decodeUnknown(UpdateUserDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
      expect(result.name).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.password).toBeUndefined();
    });

    it("should reject update DTO without id", async () => {
      const input = {
        name: "Jane Doe",
        email: "jane@example.com",
      };

      await expect(
        E.runPromise(S.decodeUnknown(UpdateUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject update DTO with invalid UUID", async () => {
      const input = {
        id: "not-a-valid-uuid",
        name: "Jane Doe",
      };

      await expect(
        E.runPromise(S.decodeUnknown(UpdateUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject update DTO with empty name", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "",
      };

      await expect(
        E.runPromise(S.decodeUnknown(UpdateUserDtoSchema)(input))
      ).rejects.toThrow();
    });
  });

  describe("RemoveUserDtoSchema", () => {
    it("should validate valid remove user DTO", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = await E.runPromise(
        S.decodeUnknown(RemoveUserDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
    });

    it("should reject remove DTO without id", async () => {
      const input = {};

      await expect(
        E.runPromise(S.decodeUnknown(RemoveUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject remove DTO with invalid UUID", async () => {
      const input = {
        id: "invalid-uuid",
      };

      await expect(
        E.runPromise(S.decodeUnknown(RemoveUserDtoSchema)(input))
      ).rejects.toThrow();
    });

    // Note: .pick() doesn't reject extra fields by default, it just ignores them
    // This is the expected behavior in Effect Schema
  });

  describe("UserBasicViewDtoSchema", () => {
    it("should validate user view DTO without password", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const { password, ...userWithoutPassword } = userData;

      const result = await E.runPromise(
        S.decodeUnknown(UserBasicViewDtoSchema)(userWithoutPassword)
      );

      expect(result.id).toBe(userData.id);
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
      expect(result.createdAt).toEqual(userData.createdAt);
      expect(result.updatedAt).toEqual(userData.updatedAt);
      expect(result).not.toHaveProperty("password");
    });

    it("should reject view DTO with missing required fields", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "John Doe",
        // missing email, createdAt, updatedAt
      };

      await expect(
        E.runPromise(S.decodeUnknown(UserBasicViewDtoSchema)(input))
      ).rejects.toThrow();
    });
  });
});

