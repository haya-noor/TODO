import { describe, it, expect } from "vitest";
import { Effect as E } from "effect";
import { User } from "@/app/domain/user/user.entity";
import { Task } from "@/app/domain/task/task.entity";
import { TestDataGenerator } from "../test.data";
import { faker } from "@faker-js/faker";

/**
 * Integration tests for User and Task domain entities
 * 
 * These tests verify that User and Task entities work together correctly
 * in realistic scenarios and workflows.
 */
describe("Domain Integration Tests", () => {
  describe("User and Task interaction", () => {
    it("should create user and assign tasks to them", async () => {
      // Create a user
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      // Create tasks assigned to this user
      const tasks = TestDataGenerator.generateTasks(5, user.id);
      const taskEntities = await Promise.all(
        tasks.map((taskData) => E.runPromise(Task.create(taskData)))
      );

      // Verify all tasks are assigned to the user, 5 = tasksPerUser
      expect(taskEntities).toHaveLength(5);
      taskEntities.forEach((task) => {
        expect(task.assigneeId).toBe(user.id);
      });
    });

    it("should handle multiple users with multiple tasks each", async () => {
      // Create multiple users (3)
      const users = TestDataGenerator.generateUsers(3);
      const userEntities = await Promise.all(
        users.map((userData) => E.runPromise(User.create(userData)))
      );

      // Create tasks for each user
      const tasksPerUser = 5;
      const allTasks: Task[] = [];

      for (const user of userEntities) {
        const userTasks = TestDataGenerator.generateTasks(tasksPerUser, user.id);
        const taskEntities = await Promise.all(
          userTasks.map((taskData) => E.runPromise(Task.create(taskData)))
        );
        allTasks.push(...taskEntities);
      }

      // Verify total tasks
      expect(allTasks).toHaveLength(3 * tasksPerUser);

      // Verify each user's tasks
      for (const user of userEntities) {
        const userTaskCount = allTasks.filter(
          (task) => task.assigneeId === user.id
        ).length;
        expect(userTaskCount).toBe(tasksPerUser);
      }
    });

    it("should maintain data integrity when updating user and their tasks", async () => {
      // Create user
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      // Create tasks for user
      const taskData = TestDataGenerator.generateValidTask({
        assigneeId: user.id,
        status: "TODO",
      });
      const task = await E.runPromise(Task.create(taskData));

      // Update user name
      const updatedUser = await E.runPromise(
        user.updateName(faker.person.fullName())
      );

      // Update task status from TODO to IN_PROGRESS 
      const updatedTask = await E.runPromise(task.updateStatus("IN_PROGRESS"));

      // Verify IDs remain consistent, user id and task assignee id remain the same
      expect(updatedUser.id).toBe(user.id);
      expect(updatedTask.assigneeId).toBe(user.id);
      expect(updatedTask.assigneeId).toBe(updatedUser.id);
    });
  });

  describe("Task workflow scenarios", () => {
    it("should simulate complete task lifecycle", async () => {
      // Create user
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      // Create task
      const taskData = TestDataGenerator.generateValidTask({
        assigneeId: user.id,
        status: "TODO",
        title: "Implement feature X",
      });
      const task = await E.runPromise(Task.create(taskData));

      // Start working on task (status from TODO to IN_PROGRESS)
      const taskUpdate1 = await E.runPromise(task.updateStatus("IN_PROGRESS"));
      expect(taskUpdate1.status).toBe("IN_PROGRESS");

      // Update task details (description) while working
      const taskUpdate2 = await E.runPromise(
        taskUpdate1.updateDescription("A".repeat(100))
      );

      // Complete the task (status from IN_PROGRESS to DONE)
      const taskUpdate3 = await E.runPromise(taskUpdate2.updateStatus("DONE"));
      expect(taskUpdate3.status).toBe("DONE");

      // Verify all state transitions maintained data integrity, all tasks have the same id
      /*
      all tasks have the same id, because they are the same task we are just updating it 
      so it doesn't create a new task. 
    
      */
      expect(task.id).toBe(taskUpdate1.id);
      expect(taskUpdate1.id).toBe(taskUpdate2.id); 
      expect(taskUpdate2.id).toBe(taskUpdate3.id); 
      expect(task.assigneeId).toBe(user.id);
      expect(taskUpdate3.assigneeId).toBe(user.id);
    });

    it("should handle multiple status changes on same task", async () => {
      const taskData = TestDataGenerator.generateValidTask({ status: "TODO" });
      const task = await E.runPromise(Task.create(taskData));

      // Sequence of status changes
      const statusSequence: Array<"TODO" | "IN_PROGRESS" | "DONE"> = [
        "IN_PROGRESS",
        "DONE",
        "TODO", // Reopen
        "IN_PROGRESS",
        "DONE",
      ];

      let currentTask = task;
      for (const status of statusSequence) {
        currentTask = await E.runPromise(currentTask.updateStatus(status));
        expect(currentTask.status).toBe(status);
      }

      // Verify final state
      expect(currentTask.status).toBe("DONE");
      expect(currentTask.id).toBe(task.id);
    });
  });

  describe("User workflow scenarios", () => {
    it("should handle user profile updates", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      // Update all user fields sequentially
      const userUpdate1 = await E.runPromise(user.updateName("New Name"));
      const userUpdate2 = await E.runPromise(userUpdate1.updateEmail("new@email.com"));
      const userUpdate3 = await E.runPromise(
        userUpdate2.updatePassword("newPassword123")
      );

      // Verify changes
      expect(userUpdate3.name).toBe("New Name");
      expect(userUpdate3.email).toBe("new@email.com");
      expect(userUpdate3.password).toBe("newPassword123");
      expect(userUpdate3.id).toBe(user.id); // ID remains the same
    });

    it("should verify user email case insensitivity", async () => {
      const userData = TestDataGenerator.generateValidUser({
        email: "test@example.com",
      });
      const user = await E.runPromise(User.create(userData));

      // Check various case combinations
      expect(user.hasEmail("test@example.com")).toBe(true);
      expect(user.hasEmail("TEST@EXAMPLE.COM")).toBe(true);
      expect(user.hasEmail("TeSt@ExAmPlE.cOm")).toBe(true);
    });
  });

  describe("Serialization and deserialization", () => {
    it("should maintain data through serialization round-trip for users", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      const serialized = await E.runPromise(user.serialized());
      const deserialized = await E.runPromise(User.create(serialized));

      expect(deserialized.id).toBe(user.id);
      expect(deserialized.name).toBe(user.name);
      expect(deserialized.email).toBe(user.email);
      expect(deserialized.password).toBe(user.password);
    });

    it("should maintain data through deserialization round-trip for tasks", async () => {
      const taskData = TestDataGenerator.generateValidTask();
      const task = await E.runPromise(Task.create(taskData));
      const serialized = await E.runPromise(task.serialized());
      const deserialized = await E.runPromise(Task.create(serialized));

      expect(deserialized.id).toBe(task.id);
      expect(deserialized.title).toBe(task.title);
      expect(deserialized.status).toBe(task.status);
      expect(deserialized.assigneeId).toBe(task.assigneeId);
    });
  });
});

