import { describe, it, expect } from "vitest";
import { Effect as E, Option } from "effect";
import * as fc from "fast-check";
import { Task } from "../../../src/domain/task/task.entity";
import { TaskValidationError } from "../../../src/domain/task/task.errors";
import { TaskId, UserId } from "../../../src/domain/brand/ids";
import {
  TestDataGenerator,
  serializedTaskArbitrary,
  validTitleArbitrary,
  validDescriptionArbitrary,
  invalidTitleArbitrary,
  invalidDescriptionArbitrary,
  taskStatusArbitrary,
} from "../../test.data";

describe("Task Entity", () => {
  describe("Task.create()", () => {
    it("should create a task with valid data using faker", async () => {
      const taskData = TestDataGenerator.generateValidTask();

      const result = await E.runPromise(Task.create(taskData));

      expect(result).toBeInstanceOf(Task);
      expect(result.title).toBe(taskData.title);
      expect(result.status).toBe(taskData.status);
      expect(result.assigneeId).toBe(taskData.assigneeId);
      expect(result.id).toBe(taskData.id);
    });

    it("should create task with optional description", async () => {
      const taskData = TestDataGenerator.generateValidTask({
        description: undefined,
      });

      const result = await E.runPromise(Task.create(taskData));

      expect(result).toBeInstanceOf(Task);
      expect(Option.isNone(result.description)).toBe(true);
    });

    it("should create task with description when provided", async () => {
      const description = "A".repeat(100); // Valid description (50-1000 chars)
      const taskData = TestDataGenerator.generateValidTask({ description });

      const result = await E.runPromise(Task.create(taskData));

      expect(result).toBeInstanceOf(Task);
      expect(Option.isSome(result.description)).toBe(true);
      expect(Option.getOrNull(result.description)).toBe(description);
    });

    it("should create multiple tasks with different data", async () => {
      const tasks = TestDataGenerator.generateTasks(10);

      const results = await Promise.all(
        tasks.map((taskData) => E.runPromise(Task.create(taskData)))
      );

      expect(results).toHaveLength(10);
      results.forEach((task, index) => {
        expect(task.title).toBe(tasks[index].title);
        expect(task.status).toBe(tasks[index].status);
      });
    });

    it("should fail with TaskValidationError for empty title", async () => {
      const invalidTask = TestDataGenerator.generateInvalidTask("title");

      await expect(E.runPromise(Task.create(invalidTask as any))).rejects.toThrow();
    });

    it("should fail with TaskValidationError for invalid description (too short)", async () => {
      const invalidTask = TestDataGenerator.generateInvalidTask("description");

      await expect(E.runPromise(Task.create(invalidTask as any))).rejects.toThrow();
    });

    it("should fail for title longer than 255 characters", async () => {
      const taskData = TestDataGenerator.generateValidTask({
        title: "a".repeat(256),
      });

      await expect(E.runPromise(Task.create(taskData))).rejects.toThrow();
    });

    it("should fail for description longer than 1000 characters", async () => {
      const taskData = TestDataGenerator.generateValidTask({
        description: "a".repeat(1001),
      });

      await expect(E.runPromise(Task.create(taskData))).rejects.toThrow();
    });

    // Property-based test: all valid tasks should create successfully
    it("should create task for any valid input (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(serializedTaskArbitrary, async (taskData) => {
          const result = await E.runPromise(Task.create(taskData));
          expect(result).toBeInstanceOf(Task);
          expect(result.title).toBe(taskData.title);
          expect(result.status).toBe(taskData.status);
          expect(result.assigneeId).toBe(taskData.assigneeId);
        }),
        { numRuns: 100 }
      );
    });

    // Property-based test: invalid titles should fail
    it("should fail for any invalid title (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(invalidTitleArbitrary, async (title) => {
          const taskData = {
            ...TestDataGenerator.generateValidTask(),
            title,
          };

          await expect(E.runPromise(Task.create(taskData))).rejects.toThrow();
        }),
        { numRuns: 50 }
      );
    });

    // Property-based test: invalid descriptions should fail
    it("should fail for any invalid description (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(invalidDescriptionArbitrary, async (description) => {
          const taskData = {
            ...TestDataGenerator.generateValidTask(),
            description,
          };

          await expect(E.runPromise(Task.create(taskData))).rejects.toThrow();
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("Task.serialized()", () => {
    it("should serialize task back to original data", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));

      const serialized = await E.runPromise(task.serialized());

      expect(serialized.title).toBe(taskData.title);
      expect(serialized.status).toBe(taskData.status);
      expect(serialized.assigneeId).toBe(taskData.assigneeId);
      expect(serialized.id).toBe(taskData.id);
    });

    it("should maintain serialization consistency (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(serializedTaskArbitrary, async (taskData) => {
          const task = await E.runPromise(Task.create(taskData));
          const serialized = await E.runPromise(task.serialized());

          expect(serialized.title).toBe(taskData.title);
          expect(serialized.status).toBe(taskData.status);
          expect(serialized.assigneeId).toBe(taskData.assigneeId);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Task.updateTitle()", () => {
    it("should update title with valid value", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      const newTitle = TestDataGenerator.generateValidTask().title;

      const updatedTask = await E.runPromise(task.updateTitle(newTitle));

      expect(updatedTask).toBeInstanceOf(Task);
      expect(updatedTask.title).toBe(newTitle);
      expect(updatedTask.status).toBe(taskData.status);
      expect(updatedTask.assigneeId).toBe(taskData.assigneeId);
      expect(updatedTask.id).toBe(taskData.id);
    });

    it("should fail with invalid title (empty)", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));

      await expect(E.runPromise(task.updateTitle(""))).rejects.toThrow();
    });

    it("should fail with invalid title (too long)", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      const tooLongTitle = "a".repeat(256);

      await expect(E.runPromise(task.updateTitle(tooLongTitle))).rejects.toThrow();
    });

    it("should update title with any valid value (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          serializedTaskArbitrary,
          validTitleArbitrary,
          async (taskData, newTitle) => {
            const task = await E.runPromise(Task.create(taskData));
            const updatedTask = await E.runPromise(task.updateTitle(newTitle));

            expect(updatedTask.title).toBe(newTitle);
            expect(updatedTask.status).toBe(taskData.status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Task.updateDescription()", () => {
    it("should update description with valid value", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      const newDescription = "A".repeat(100); // Valid: 50-1000 chars

      const updatedTask = await E.runPromise(task.updateDescription(newDescription));

      expect(updatedTask).toBeInstanceOf(Task);
      expect(Option.isSome(updatedTask.description)).toBe(true);
      expect(Option.getOrNull(updatedTask.description)).toBe(newDescription);
    });

    it("should set description to None when undefined", async () => {
      const taskData = TestDataGenerator.generateValidTask({
        description: "A".repeat(100),
      });
      const task = await E.runPromise(Task.create(taskData));

      const updatedTask = await E.runPromise(task.updateDescription(undefined));

      expect(updatedTask).toBeInstanceOf(Task);
      expect(Option.isNone(updatedTask.description)).toBe(true);
    });

    it("should fail with invalid description (too short)", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      const tooShortDescription = "short";

      await expect(
        E.runPromise(task.updateDescription(tooShortDescription))
      ).rejects.toThrow();
    });

    it("should fail with invalid description (too long)", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      const tooLongDescription = "a".repeat(1001);

      await expect(
        E.runPromise(task.updateDescription(tooLongDescription))
      ).rejects.toThrow();
    });

    it("should update description with any valid value (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          serializedTaskArbitrary,
          fc.oneof(validDescriptionArbitrary, fc.constant(undefined)),
          async (taskData, newDescription) => {
            const task = await E.runPromise(Task.create(taskData));
            const updatedTask = await E.runPromise(task.updateDescription(newDescription));

            if (newDescription === undefined) {
              expect(Option.isNone(updatedTask.description)).toBe(true);
            } else {
              expect(Option.getOrNull(updatedTask.description)).toBe(newDescription);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Task.updateStatus()", () => {
    it("should update status from TODO to IN_PROGRESS", async () => {
      const taskData = TestDataGenerator.generateValidTask({ status: "TODO" });
      const task = await E.runPromise(Task.create(taskData));

      const updatedTask = await E.runPromise(task.updateStatus("IN_PROGRESS"));

      expect(updatedTask).toBeInstanceOf(Task);
      expect(updatedTask.status).toBe("IN_PROGRESS");
      expect(updatedTask.title).toBe(taskData.title);
    });

    it("should update status from IN_PROGRESS to DONE", async () => {
      const taskData = TestDataGenerator.generateValidTask({ status: "IN_PROGRESS" });
      const task = await E.runPromise(Task.create(taskData));

      const updatedTask = await E.runPromise(task.updateStatus("DONE"));

      expect(updatedTask).toBeInstanceOf(Task);
      expect(updatedTask.status).toBe("DONE");
    });

    it("should update status from DONE to TODO", async () => {
      const taskData = TestDataGenerator.generateValidTask({ status: "DONE" });
      const task = await E.runPromise(Task.create(taskData));

      const updatedTask = await E.runPromise(task.updateStatus("TODO"));

      expect(updatedTask).toBeInstanceOf(Task);
      expect(updatedTask.status).toBe("TODO");
    });

    it("should update status to any valid value (property test)", async () => {
      await fc.assert(
        fc.asyncProperty(
          serializedTaskArbitrary,
          taskStatusArbitrary,
          async (taskData, newStatus) => {
            const task = await E.runPromise(Task.create(taskData));
            const updatedTask = await E.runPromise(task.updateStatus(newStatus));

            expect(updatedTask.status).toBe(newStatus);
            expect(updatedTask.title).toBe(taskData.title);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should allow updating to same status (idempotent)", async () => {
      const taskData = TestDataGenerator.generateValidTask({ status: "TODO" });
      const task = await E.runPromise(Task.create(taskData));

      const updatedTask = await E.runPromise(task.updateStatus("TODO"));

      expect(updatedTask.status).toBe("TODO");
    });
  });

  describe("Task status transitions", () => {
    it("should support all status transition paths", async () => {
      const taskData = TestDataGenerator.generateValidTask({ status: "TODO" });
      const task1 = await E.runPromise(Task.create(taskData));

      // TODO -> IN_PROGRESS -> DONE
      const task2 = await E.runPromise(task1.updateStatus("IN_PROGRESS"));
      const task3 = await E.runPromise(task2.updateStatus("DONE"));

      expect(task1.status).toBe("TODO");
      expect(task2.status).toBe("IN_PROGRESS");
      expect(task3.status).toBe("DONE");

      // DONE -> TODO (reopen)
      const task4 = await E.runPromise(task3.updateStatus("TODO"));
      expect(task4.status).toBe("TODO");

      // TODO -> DONE (direct completion)
      const task5 = await E.runPromise(task4.updateStatus("DONE"));
      expect(task5.status).toBe("DONE");
    });
  });

  describe("Task immutability", () => {
    it("should create new instance on updates (immutability)", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      const newTitle = TestDataGenerator.generateValidTask().title;

      const updatedTask = await E.runPromise(task.updateTitle(newTitle));

      expect(task).not.toBe(updatedTask);
      expect(task.title).toBe(taskData.title);
      expect(updatedTask.title).toBe(newTitle);
    });

    it("should maintain immutability across multiple updates", async () => {
      const taskData = TestDataGenerator.generateValidTask({ status: "TODO" });
      const task1 = await E.runPromise(Task.create(taskData));
      const task2 = await E.runPromise(task1.updateTitle("Updated Title"));
      const task3 = await E.runPromise(task2.updateStatus("IN_PROGRESS"));
      const task4 = await E.runPromise(
        task3.updateDescription("A".repeat(100))
      );

      expect(task1.title).toBe(taskData.title);
      expect(task2.title).toBe("Updated Title");
      expect(task3.title).toBe("Updated Title");
      expect(task4.title).toBe("Updated Title");

      expect(task1.status).toBe("TODO");
      expect(task2.status).toBe("TODO");
      expect(task3.status).toBe("IN_PROGRESS");
      expect(task4.status).toBe("IN_PROGRESS");
    });
  });

  describe("Task with assignee", () => {
    it("should create tasks for specific assignee", async () => {
      const userId = TestDataGenerator.generateValidUser().id;
      const tasks = TestDataGenerator.generateTasks(5, userId);

      const results = await Promise.all(
        tasks.map((taskData) => E.runPromise(Task.create(taskData)))
      );

      expect(results).toHaveLength(5);
      results.forEach((task) => {
        expect(task.assigneeId).toBe(userId);
      });
    });

    it("should maintain assignee across updates", async () => {
      const userId = TestDataGenerator.generateValidUser().id;
      const taskData = TestDataGenerator.generateValidTask({ assigneeId: userId });
      const task = await E.runPromise(Task.create(taskData));

      const updatedTask = await E.runPromise(task.updateTitle("New Title"));

      expect(updatedTask.assigneeId).toBe(userId);
    });
  });

  describe("Task edge cases", () => {
    it("should handle minimum valid title length (1 character)", async () => {
      const taskData = TestDataGenerator.generateValidTask({ title: "A" });

      const task = await E.runPromise(Task.create(taskData));

      expect(task.title).toBe("A");
    });

    it("should handle maximum valid title length (255 characters)", async () => {
      const maxTitle = "A".repeat(255);
      const taskData = TestDataGenerator.generateValidTask({ title: maxTitle });

      const task = await E.runPromise(Task.create(taskData));

      expect(task.title).toBe(maxTitle);
    });

    it("should handle minimum valid description length (50 characters)", async () => {
      const minDescription = "A".repeat(50);
      const taskData = TestDataGenerator.generateValidTask({
        description: minDescription,
      });

      const task = await E.runPromise(Task.create(taskData));

      expect(Option.getOrNull(task.description)).toBe(minDescription);
    });

    it("should handle maximum valid description length (1000 characters)", async () => {
      const maxDescription = "A".repeat(1000);
      const taskData = TestDataGenerator.generateValidTask({
        description: maxDescription,
      });

      const task = await E.runPromise(Task.create(taskData));

      expect(Option.getOrNull(task.description)).toBe(maxDescription);
    });
  });
});

