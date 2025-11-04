import { describe, it, expect } from "vitest";
import { Effect as E, Schema as S, Option as O } from "effect";
import {
  CreateTaskDtoSchema,
  UpdateTaskDtoSchema,
  RemoveTaskDtoSchema,
  TaskBasicViewDtoSchema,
  TaskSearchDtoSchema,
} from "../../../src/app/application/task/task.dtos";
import { TestDataGenerator } from "../../test.data";

describe("Task DTOs", () => {
  describe("CreateTaskDtoSchema", () => {
    it("should validate valid create task DTO", async () => {
      const input = {
        title: "Complete project documentation",
        description: "Write comprehensive documentation for all modules and features. Include examples and best practices for future reference.",
        status: "TODO" as const,
        assigneeId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = await E.runPromise(
        S.decodeUnknown(CreateTaskDtoSchema)(input)
      );

      expect(result.title).toBe(input.title);
      expect(O.isSome(result.description)).toBe(true);
      if (O.isSome(result.description)) {
        expect(result.description.value).toBe(input.description);
      }
      expect(result.status).toBe(input.status);
      expect(result.assigneeId).toBe(input.assigneeId);
    });

    it("should validate create task DTO without description", async () => {
      const input = {
        title: "Quick task",
        description: undefined,
        status: "TODO" as const,
        assigneeId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = await E.runPromise(
        S.decodeUnknown(CreateTaskDtoSchema)(input)
      );

      expect(result.title).toBe(input.title);
      expect(O.isNone(result.description)).toBe(true);
    });

    it("should reject DTO with missing title", async () => {
      const input = {
        description: "A long description that meets the minimum character requirement for task descriptions.",
        status: "TODO",
        assigneeId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with empty title", async () => {
      const input = {
        title: "",
        description: "A long description that meets the minimum character requirement for task descriptions.",
        status: "TODO",
        assigneeId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with invalid status", async () => {
      const input = {
        title: "Valid title",
        description: "A long description that meets the minimum character requirement for task descriptions.",
        status: "INVALID_STATUS",
        assigneeId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with invalid assigneeId", async () => {
      const input = {
        title: "Valid title",
        description: "A long description that meets the minimum character requirement for task descriptions.",
        status: "TODO",
        assigneeId: "not-a-uuid",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject DTO with description too short", async () => {
      const input = {
        title: "Valid title",
        description: "Short", // Less than 50 characters
        status: "TODO",
        assigneeId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        E.runPromise(S.decodeUnknown(CreateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    // Note: .pick() doesn't reject extra fields by default, it just ignores them
    // This is the expected behavior in Effect Schema
  });

  describe("UpdateTaskDtoSchema", () => {
    it("should validate valid update task DTO with all fields", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Updated title",
        description: "Updated description that is long enough to meet the minimum character requirement for descriptions.",
        status: "IN_PROGRESS" as const,
        assigneeId: "660e8400-e29b-41d4-a716-446655440001",
      };

      const result = await E.runPromise(
        S.decodeUnknown(UpdateTaskDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
      expect(result.title).toBe(input.title);
      expect(result.description).toBeDefined();
      if (result.description !== undefined && O.isSome(result.description)) {
        expect(result.description.value).toBe(input.description);
      }
      expect(result.status).toBe(input.status);
      expect(result.assigneeId).toBe(input.assigneeId);
    });

    it("should validate update DTO with only id and title", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Updated title",
      };

      const result = await E.runPromise(
        S.decodeUnknown(UpdateTaskDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
      expect(result.title).toBe(input.title);
      expect(result.description).toBeUndefined();
      expect(result.status).toBeUndefined();
      expect(result.assigneeId).toBeUndefined();
    });

    it("should validate update DTO with only id and status", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "DONE" as const,
      };

      const result = await E.runPromise(
        S.decodeUnknown(UpdateTaskDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
      expect(result.status).toBe(input.status);
    });

    it("should validate update DTO with only id (no updates)", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = await E.runPromise(
        S.decodeUnknown(UpdateTaskDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
    });

    it("should reject update DTO without id", async () => {
      const input = {
        title: "Updated title",
        status: "DONE",
      };

      await expect(
        E.runPromise(S.decodeUnknown(UpdateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject update DTO with invalid UUID", async () => {
      const input = {
        id: "not-a-valid-uuid",
        title: "Updated title",
      };

      await expect(
        E.runPromise(S.decodeUnknown(UpdateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject update DTO with empty title", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "",
      };

      await expect(
        E.runPromise(S.decodeUnknown(UpdateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject update DTO with invalid status", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "INVALID",
      };

      await expect(
        E.runPromise(S.decodeUnknown(UpdateTaskDtoSchema)(input))
      ).rejects.toThrow();
    });
  });

  describe("RemoveTaskDtoSchema", () => {
    it("should validate valid remove task DTO", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = await E.runPromise(
        S.decodeUnknown(RemoveTaskDtoSchema)(input)
      );

      expect(result.id).toBe(input.id);
    });

    it("should reject remove DTO without id", async () => {
      const input = {};

      await expect(
        E.runPromise(S.decodeUnknown(RemoveTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject remove DTO with invalid UUID", async () => {
      const input = {
        id: "invalid-uuid",
      };

      await expect(
        E.runPromise(S.decodeUnknown(RemoveTaskDtoSchema)(input))
      ).rejects.toThrow();
    });

    // Note: .pick() doesn't reject extra fields by default, it just ignores them
    // This is the expected behavior in Effect Schema
  });

  describe("TaskBasicViewDtoSchema", () => {
    it("should validate complete task view DTO", async () => {
      const taskData = TestDataGenerator.generateValidTask();

      const result = await E.runPromise(
        S.decodeUnknown(TaskBasicViewDtoSchema)(taskData)
      );

      expect(result.id).toBe(taskData.id);
      expect(result.title).toBe(taskData.title);
      // Description is an Option type
      if (taskData.description) {
        expect(O.isSome(result.description)).toBe(true);
        if (O.isSome(result.description)) {
          expect(result.description.value).toBe(taskData.description);
        }
      }
      expect(result.status).toBe(taskData.status);
      expect(result.assigneeId).toBe(taskData.assigneeId);
      expect(result.createdAt).toEqual(taskData.createdAt);
      expect(result.updatedAt).toEqual(taskData.updatedAt);
    });

    it("should reject view DTO with missing required fields", async () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Task title",
        // missing other required fields
      };

      await expect(
        E.runPromise(S.decodeUnknown(TaskBasicViewDtoSchema)(input))
      ).rejects.toThrow();
    });
  });

  describe("TaskSearchDtoSchema", () => {
    it("should validate valid search params", async () => {
      const input = {
        page: 1,
        limit: 10,
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
        status: "TODO" as const,
        assigneeId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = await E.runPromise(
        S.decodeUnknown(TaskSearchDtoSchema)(input)
      );

      expect(result.page).toBe(input.page);
      expect(result.limit).toBe(input.limit);
      expect(result.sortBy).toBe(input.sortBy);
      expect(result.status).toBe(input.status);
    });

    it("should validate search params with multiple statuses", async () => {
      const input = {
        page: 1,
        limit: 20,
        status: ["TODO", "IN_PROGRESS"] as const,
      };

      const result = await E.runPromise(
        S.decodeUnknown(TaskSearchDtoSchema)(input)
      );

      expect(result.status).toEqual(input.status);
    });

    it("should validate search params with text filter", async () => {
      const input = {
        page: 1,
        limit: 10,
        text: "search term",
      };

      const result = await E.runPromise(
        S.decodeUnknown(TaskSearchDtoSchema)(input)
      );

      expect(result.text).toBe(input.text);
    });

    it("should validate search params with date range", async () => {
      const createdFrom = new Date("2024-01-01");
      const createdTo = new Date("2024-12-31");
      
      const input = {
        page: 1,
        limit: 10,
        createdFrom,
        createdTo,
      };

      const result = await E.runPromise(
        S.decodeUnknown(TaskSearchDtoSchema)(input)
      );

      expect(result.createdFrom).toEqual(createdFrom);
      expect(result.createdTo).toEqual(createdTo);
    });

    it("should reject search params with invalid date range", async () => {
      const input = {
        page: 1,
        limit: 10,
        createdFrom: new Date("2024-12-31"),
        createdTo: new Date("2024-01-01"), // createdTo before createdFrom
      };

      await expect(
        E.runPromise(S.decodeUnknown(TaskSearchDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject search params with invalid sortBy", async () => {
      const input = {
        page: 1,
        limit: 10,
        sortBy: "invalidField",
      };

      await expect(
        E.runPromise(S.decodeUnknown(TaskSearchDtoSchema)(input))
      ).rejects.toThrow();
    });

    it("should reject search params with missing page or limit", async () => {
      const input = {
        sortBy: "createdAt",
      };

      await expect(
        E.runPromise(S.decodeUnknown(TaskSearchDtoSchema)(input))
      ).rejects.toThrow();
    });
  });
});

