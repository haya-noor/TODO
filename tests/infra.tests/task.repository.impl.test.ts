import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Effect as E, Option as O } from "effect";
import { TaskDrizzleRepository } from "../../src/app/infra/repository/task.repository.impl";
import { Task } from "@/app/domain/task/task.entity";
import { UUID } from "@/app/domain/brand/constructors";
import { TestDataGenerator } from "../test.data";
import { createConnection, closeConnection } from "../dbsetup/db.connection";
import {
  setupTestDatabase,
  cleanTestDatabase,
  teardownTestDatabase,
} from "../dbsetup/db.setup";

describe("TaskDrizzleRepository", () => {
  let db: any;
  let client: any;
  let repository: TaskDrizzleRepository;

  beforeAll(async () => {
    const connection = createConnection();
    client = connection.client;
    db = connection.db;
    repository = new TaskDrizzleRepository(db);

    await setupTestDatabase(db);
  });

  beforeEach(async () => {
    await cleanTestDatabase(db);
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
    await closeConnection(client);
  });

  describe("add", () => {
    it("should successfully add a new task to the database", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));

      const result = await E.runPromise(repository.add(task));

      expect(result).toBeDefined();
      expect(result.id).toBe(task.id);
      expect(result.title).toBe(task.title);
      expect(result.status).toBe(task.status);

      const fetched = await E.runPromise(repository.fetchById(task.id));
      expect(O.isSome(fetched)).toBe(true);
    });

    it("should persist core task fields correctly", async () => {
      const now = new Date();
      const taskData = TestDataGenerator.generateValidTask({
        title: "Write integration tests",
        status: "IN_PROGRESS",
        createdAt: now,
        updatedAt: now,
      });
      const task = await E.runPromise(Task.create(taskData));

      await E.runPromise(repository.add(task));

      const fetched = await E.runPromise(repository.fetchById(task.id));
      expect(O.isSome(fetched)).toBe(true);
      if (O.isSome(fetched)) {
        expect(fetched.value.title).toBe("Write integration tests");
        expect(fetched.value.status).toBe("IN_PROGRESS");
        expect(fetched.value.assigneeId).toBe(task.assigneeId);
      }
    });

    it("should handle adding multiple tasks", async () => {
      const tasks = await Promise.all(
        TestDataGenerator.generateTasks(3).map((data) => E.runPromise(Task.create(data)))
      );

      for (const t of tasks) {
        await E.runPromise(repository.add(t));
      }

      const all = await E.runPromise(repository.fetchAll());
      expect(all).toHaveLength(3);
    });
  });

  describe("update", () => {
    it("should successfully update an existing task", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      await E.runPromise(repository.add(task));

      const updated = await E.runPromise(task.updateTitle("Updated Task Title"));
      const result = await E.runPromise(repository.update(updated));

      expect(result.title).toBe("Updated Task Title");

      const fetched = await E.runPromise(repository.fetchById(task.id));
      expect(O.isSome(fetched)).toBe(true);
      if (O.isSome(fetched)) {
        expect(fetched.value.title).toBe("Updated Task Title");
      }
    });

    it("should fail when updating non-existent task", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));

      await expect(E.runPromise(repository.update(task))).rejects.toThrow();
    });

    it("should update multiple fields", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      await E.runPromise(repository.add(task));

      let updated = await E.runPromise(task.updateTitle("New Title"));
      updated = await E.runPromise(updated.updateStatus("DONE"));

      await E.runPromise(repository.update(updated));

      const fetched = await E.runPromise(repository.fetchById(task.id));
      expect(O.isSome(fetched)).toBe(true);
      if (O.isSome(fetched)) {
        expect(fetched.value.title).toBe("New Title");
        expect(fetched.value.status).toBe("DONE");
      }
    });
  });

  describe("fetchAll", () => {
    it("should fetch all tasks from the database", async () => {
      const tasksData = TestDataGenerator.generateTasks(5);
      const tasks = await Promise.all(tasksData.map((d) => E.runPromise(Task.create(d))));

      for (const t of tasks) {
        await E.runPromise(repository.add(t));
      }

      const result = await E.runPromise(repository.fetchAll());
      expect(result).toHaveLength(5);
      expect(result.every((t) => t instanceof Task)).toBe(true);
    });

    it("should return empty array when no tasks exist", async () => {
      const result = await E.runPromise(repository.fetchAll());
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should fetch tasks with correct data", async () => {
      const data = TestDataGenerator.generateValidTask({
        title: "Test Task",
      });
      const task = await E.runPromise(Task.create(data));
      await E.runPromise(repository.add(task));

      const result = await E.runPromise(repository.fetchAll());
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Task");
    });
  });

  describe("fetchById", () => {
    it("should successfully fetch a task by id", async () => {
      const data = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(data));
      await E.runPromise(repository.add(task));

      const result = await E.runPromise(repository.fetchById(task.id));
      expect(O.isSome(result)).toBe(true);
      if (O.isSome(result)) {
        expect(result.value).toBeInstanceOf(Task);
        expect(result.value.id).toBe(task.id);
        expect(result.value.title).toBe(task.title);
      }
    });

    it("should return None when task does not exist", async () => {
      const nonExistent = TestDataGenerator.generateValidTask();
      const result = await E.runPromise(
        repository.fetchById(UUID.fromTrusted(nonExistent.id))
      );
      expect(O.isNone(result)).toBe(true);
    });

    it("should fetch the correct task among multiple tasks", async () => {
      const tasksData = TestDataGenerator.generateTasks(3);
      const tasks = await Promise.all(tasksData.map((d) => E.runPromise(Task.create(d))));

      for (const t of tasks) {
        await E.runPromise(repository.add(t));
      }

      const result = await E.runPromise(repository.fetchById(tasks[1].id));
      expect(O.isSome(result)).toBe(true);
      if (O.isSome(result)) {
        expect(result.value.id).toBe(tasks[1].id);
        expect(result.value.title).toBe(tasks[1].title);
      }
    });
  });

  describe("deleteById", () => {
    it("should successfully delete an existing task", async () => {
      const data = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(data));
      await E.runPromise(repository.add(task));

      let fetched = await E.runPromise(repository.fetchById(task.id));
      expect(O.isSome(fetched)).toBe(true);

      const deleted = await E.runPromise(repository.deleteById(task.id));
      expect(deleted.id).toBe(task.id);

      fetched = await E.runPromise(repository.fetchById(task.id));
      expect(O.isNone(fetched)).toBe(true);
    });

    it("should fail when deleting non-existent task", async () => {
      const nonExistent = TestDataGenerator.generateValidTask();
      await expect(
        E.runPromise(repository.deleteById(UUID.fromTrusted(nonExistent.id)))
      ).rejects.toThrow();
    });

    it("should not affect other tasks when deleting one", async () => {
      const tasksData = TestDataGenerator.generateTasks(3);
      const tasks = await Promise.all(tasksData.map((d) => E.runPromise(Task.create(d))));
      for (const t of tasks) {
        await E.runPromise(repository.add(t));
      }

      await E.runPromise(repository.deleteById(tasks[1].id));

      const t1 = await E.runPromise(repository.fetchById(tasks[0].id));
      const t3 = await E.runPromise(repository.fetchById(tasks[2].id));
      expect(O.isSome(t1)).toBe(true);
      expect(O.isSome(t3)).toBe(true);

      const deleted = await E.runPromise(repository.fetchById(tasks[1].id));
      expect(O.isNone(deleted)).toBe(true);
    });
  });

  describe("search", () => {
    it("should successfully search tasks with pagination", async () => {
      const tasksData = TestDataGenerator.generateTasks(10);
      const tasks = await Promise.all(tasksData.map((d) => E.runPromise(Task.create(d))));
      for (const t of tasks) {
        await E.runPromise(repository.add(t));
      }

      const result = await E.runPromise(
        repository.search({ page: 1, limit: 4 })
      );

      expect(result.data).toHaveLength(4);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(4);
    });

    it("should return empty results when no tasks exist", async () => {
      const result = await E.runPromise(
        repository.search({ page: 1, limit: 5 })
      );
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should filter tasks by text in title or description", async () => {
      const t1 = await E.runPromise(
        Task.create(
          TestDataGenerator.generateValidTask({
            title: "Alpha task",
            description: "Something about alpha that is definitely longer than fifty characters."
          })
        )
      );
      const t2 = await E.runPromise(
        Task.create(
          TestDataGenerator.generateValidTask({
            title: "Beta work item",
            description: "Notes about beta functionality with sufficient length to pass validation."
          })
        )
      );
      const t3 = await E.runPromise(
        Task.create(
          TestDataGenerator.generateValidTask({
            title: "Alpha follow-up",
            description: "More alpha content that exceeds the fifty character minimum requirement."
          })
        )
      );

      await E.runPromise(repository.add(t1));
      await E.runPromise(repository.add(t2));
      await E.runPromise(repository.add(t3));

      const result = await E.runPromise(
        repository.search({ page: 1, limit: 10, text: "Alpha" })
      );

      expect(result.data.length).toBe(2);
      const titles = result.data.map((t) => t.title);
      expect(titles.every((title) => title.includes("Alpha"))).toBe(true);
    });
  });
});


