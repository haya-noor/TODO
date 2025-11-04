import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Effect as E, Option as O } from "effect";
import { UserDrizzleRepository } from "../../src/app/infra/repository/user.repository.impl";
import { User } from "@/app/domain/user/user.entity";
import { TestDataGenerator } from "../test.data";
import { UUID } from "@/app/domain/brand/constructors";
import { createConnection, closeConnection } from "../dbsetup/db.connection";
import { 
  setupTestDatabase, 
  cleanTestDatabase, 
  teardownTestDatabase 
} from "../dbsetup/db.setup";

/**
 * Integration Tests for UserDrizzleRepository
 * 
 * These tests use a REAL PostgreSQL database running in Docker Desktop.
 * They test the actual database interactions.
 * 
 * Prerequisites:
 * - PostgreSQL container running on localhost:5432
 * - Test database created (or will be created automatically)
 */
describe("UserDrizzleRepository", () => {
  let db: any;
  let client: any;
  let repository: UserDrizzleRepository;

  // Setup: Create database connection and tables
  beforeAll(async () => {
    const connection = createConnection();
    client = connection.client;
    db = connection.db;
    repository = new UserDrizzleRepository(db);

    // Create tables using migrations
    await setupTestDatabase(db);
  });

  // Cleanup: Remove all data before each test
  beforeEach(async () => {
    await cleanTestDatabase(db);
  });

  // Teardown: Drop tables and close connection
  afterAll(async () => {
    await teardownTestDatabase(db);
    await closeConnection(client);
  });

  describe("add", () => {
    it("should successfully add a new user to the database", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      const result = await E.runPromise(repository.add(user));

      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe(user.name);
      expect(result.email).toBe(user.email);

      // Verify user was actually inserted by fetching it back
      const fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isSome(fetchedUser)).toBe(true);
    });

    it("should persist all user fields correctly", async () => {
      const userData = TestDataGenerator.generateValidUser({
        name: "John Doe",
        email: "john.doe@example.com",
        password: "securePassword123",
      });
      const user = await E.runPromise(User.create(userData));

      await E.runPromise(repository.add(user));

      const fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isSome(fetchedUser)).toBe(true);
      
      if (O.isSome(fetchedUser)) {
        expect(fetchedUser.value.name).toBe("John Doe");
        expect(fetchedUser.value.email).toBe("john.doe@example.com");
        expect(fetchedUser.value.password).toBe("securePassword123");
      }
    });

    it("should handle adding multiple users", async () => {
      const users = await Promise.all(
        TestDataGenerator.generateUsers(3).map((userData) =>
          E.runPromise(User.create(userData))
        )
      );

      for (const user of users) {await E.runPromise(repository.add(user));}

      const allUsers = await E.runPromise(repository.fetchAll());
      expect(allUsers).toHaveLength(3);
    });
  });

  describe("update", () => {
    it("should successfully update an existing user", async () => {
      // First, add a user
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      await E.runPromise(repository.add(user));

      // Update the user's name
      const updatedUser = await E.runPromise(user.updateName("Updated Name"));
      const result = await E.runPromise(repository.update(updatedUser));

      expect(result.name).toBe("Updated Name");

      // Verify update persisted
      const fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isSome(fetchedUser)).toBe(true);
      if (O.isSome(fetchedUser)) {
        expect(fetchedUser.value.name).toBe("Updated Name");
      }
    });

    it("should fail when updating non-existent user", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));

      // Try to update without adding first
      await expect(E.runPromise(repository.update(user))).rejects.toThrow();
    });

    it("should update multiple fields", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      await E.runPromise(repository.add(user));

      // Update multiple fields
      let updatedUser = await E.runPromise(user.updateName("New Name"));
      updatedUser = await E.runPromise(updatedUser.updateEmail("new@email.com"));
      
      await E.runPromise(repository.update(updatedUser));

      // Verify all updates persisted
      const fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isSome(fetchedUser)).toBe(true);
      if (O.isSome(fetchedUser)) {
        expect(fetchedUser.value.name).toBe("New Name");
        expect(fetchedUser.value.email).toBe("new@email.com");
      }
    });
  });

  describe("fetchAll", () => {
    it("should fetch all users from the database", async () => {
      const usersData = TestDataGenerator.generateUsers(5);
      const users = await Promise.all(
        usersData.map((userData) => E.runPromise(User.create(userData)))
      );

      for (const user of users) {
        await E.runPromise(repository.add(user));
      }

      const result = await E.runPromise(repository.fetchAll());

      expect(result).toHaveLength(5);
      expect(result.every((u) => u instanceof User)).toBe(true);
    });

    it("should return empty array when no users exist", async () => {
      const result = await E.runPromise(repository.fetchAll());
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should fetch users with correct data", async () => {
      const userData = TestDataGenerator.generateValidUser({
        name: "Test User",
        email: "test@example.com",
      });
      const user = await E.runPromise(User.create(userData));
      await E.runPromise(repository.add(user));

      const result = await E.runPromise(repository.fetchAll());

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test User");
      expect(result[0].email).toBe("test@example.com");
    });
  });

  describe("fetchById", () => {
    it("should successfully fetch a user by id", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      await E.runPromise(repository.add(user));

      const result = await E.runPromise(repository.fetchById(user.id));

      expect(O.isSome(result)).toBe(true);
      if (O.isSome(result)) {
        expect(result.value).toBeInstanceOf(User);
        expect(result.value.id).toBe(user.id);
        expect(result.value.name).toBe(user.name);
      }
    });

    it("should return None when user does not exist", async () => {
      const nonExistentId = UUID.fromTrusted("non-existent-id-12345");
      const result = await E.runPromise(repository.fetchById(nonExistentId));

      expect(O.isNone(result)).toBe(true);
    });

    it("should fetch the correct user among multiple users", async () => {
      const usersData = TestDataGenerator.generateUsers(3);
      const users = await Promise.all(
        usersData.map((userData) => E.runPromise(User.create(userData)))
      );

      for (const user of users) {
        await E.runPromise(repository.add(user));
      }

      // Fetch the second user
      const result = await E.runPromise(repository.fetchById(users[1].id));

      expect(O.isSome(result)).toBe(true);
      if (O.isSome(result)) {
        expect(result.value.id).toBe(users[1].id);
        expect(result.value.name).toBe(users[1].name);
      }
    });
  });

  describe("deleteById", () => {
    it("should successfully delete an existing user", async () => {
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      await E.runPromise(repository.add(user));

      // Verify user exists
      let fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isSome(fetchedUser)).toBe(true);

      // Delete user
      const deletedUser = await E.runPromise(repository.deleteById(user.id));
      expect(deletedUser.id).toBe(user.id);

      // Verify user no longer exists
      fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isNone(fetchedUser)).toBe(true);
    });

    it("should fail when deleting non-existent user", async () => {
      const nonExistentId = UUID.fromTrusted("non-existent-id");
      await expect(E.runPromise(repository.deleteById(nonExistentId))).rejects.toThrow();
    });

    it("should return the deleted user entity", async () => {
      const userData = TestDataGenerator.generateValidUser({
        name: "User to Delete",
        email: "delete@example.com",
      });
      const user = await E.runPromise(User.create(userData));
      await E.runPromise(repository.add(user));

      const result = await E.runPromise(repository.deleteById(user.id));

      expect(result.name).toBe("User to Delete");
      expect(result.email).toBe("delete@example.com");
    });

    it("should not affect other users when deleting one", async () => {
      const usersData = TestDataGenerator.generateUsers(3);
      const users = await Promise.all(
        usersData.map((userData) => E.runPromise(User.create(userData)))
      );

      for (const user of users) {
        await E.runPromise(repository.add(user));
      }

      // Delete the second user
      await E.runPromise(repository.deleteById(users[1].id));

      // Verify other users still exist
      const user1 = await E.runPromise(repository.fetchById(users[0].id));
      const user3 = await E.runPromise(repository.fetchById(users[2].id));

      expect(O.isSome(user1)).toBe(true);
      expect(O.isSome(user3)).toBe(true);

      // Verify deleted user doesn't exist
      const deletedUser = await E.runPromise(repository.fetchById(users[1].id));
      expect(O.isNone(deletedUser)).toBe(true);
    });
  });

  describe("fetchPaginated", () => {
    it("should successfully fetch paginated users", async () => {
      // Add 15 users
      const usersData = TestDataGenerator.generateUsers(15);
      const users = await Promise.all(
        usersData.map((userData) => E.runPromise(User.create(userData)))
      );

      for (const user of users) {
        await E.runPromise(repository.add(user));
      }

      const result = await E.runPromise(
        repository.fetchPaginated({ page: 1, limit: 5 })
      );

      expect(result.data).toHaveLength(5);     // 5 users per page
      expect(result.pagination.total).toBe(15); // 15 total users
      expect(result.pagination.page).toBe(1);   // page 1
      expect(result.pagination.limit).toBe(5);   // 5 users per page
      expect(result.pagination.totalPages).toBe(3); // 3 pages total
      expect(result.pagination.hasNext).toBe(true); // has next page
      expect(result.pagination.hasPrev).toBe(false); //the first page doesn't have a previous page
    });

    it("should handle empty results", async () => {
      const result = await E.runPromise(
        repository.fetchPaginated({ page: 1, limit: 10 })
      );

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should fetch different pages correctly", async () => {
      const usersData = TestDataGenerator.generateUsers(10);
      const users = await Promise.all(
        usersData.map((userData) => E.runPromise(User.create(userData)))
      );

      for (const user of users) {
        await E.runPromise(repository.add(user));
      }

      // Fetch page 1
      const page1 = await E.runPromise(
        repository.fetchPaginated({ page: 1, limit: 3 })
      );

      // Fetch page 2
      const page2 = await E.runPromise(
        repository.fetchPaginated({ page: 2, limit: 3 })
      );

      expect(page1.data).toHaveLength(3);
      expect(page2.data).toHaveLength(3);

      // Verify different users on different pages
      const page1Ids = page1.data.map((u) => u.id);  // get the ids of the users on page 1
      const page2Ids = page2.data.map((u) => u.id);  // get the ids of the users on page 2
      const overlap = page1Ids.filter((id) => page2Ids.includes(id)); // get the ids that are in both pages
      expect(overlap).toHaveLength(0); // no overlap means the users are different
    });


    // if the last page has fewer items than the limit, the last page should have the 
    // remaining items and the test should pass
    it("should handle last page with fewer items", async () => {
      const usersData = TestDataGenerator.generateUsers(7); // 7 users
      const users = await Promise.all(
        usersData.map((userData) => E.runPromise(User.create(userData)))
      );

      for (const user of users) {
        await E.runPromise(repository.add(user));
      }

      const result = await E.runPromise(
        repository.fetchPaginated({ page: 3, limit: 3 })
      );

      expect(result.data).toHaveLength(1);     // 1 user on the last page
      expect(result.pagination.total).toBe(7); // 7 total users
      expect(result.pagination.page).toBe(3);   // page 3
      expect(result.pagination.hasNext).toBe(false); // no next page
      expect(result.pagination.hasPrev).toBe(true); // has previous page
    });
  });

  describe("Complex scenarios", () => {
    it("should handle complete CRUD(Create, Read, Update, Delete) cycle", async () => {
      // Create
      const userData = TestDataGenerator.generateValidUser();
      const user = await E.runPromise(User.create(userData));
      await E.runPromise(repository.add(user));

      // Read (Fetch)
      let fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isSome(fetchedUser)).toBe(true);

      // Update
      const updatedUser = await E.runPromise(user.updateName("Updated Name"));
      await E.runPromise(repository.update(updatedUser));

      fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isSome(fetchedUser)).toBe(true);
      if (O.isSome(fetchedUser)) {
        expect(fetchedUser.value.name).toBe("Updated Name");
      }

      // Delete
      await E.runPromise(repository.deleteById(user.id));
      fetchedUser = await E.runPromise(repository.fetchById(user.id));
      expect(O.isNone(fetchedUser)).toBe(true);
    });

    it("should maintain data integrity with concurrent operations", async () => {
      const usersData = TestDataGenerator.generateUsers(10);
      const users = await Promise.all(
        usersData.map((userData) => E.runPromise(User.create(userData)))
      );

      // Add all users concurrently
      await Promise.all(
        users.map((user) => E.runPromise(repository.add(user)))
      );

      // Fetch all users
      const allUsers = await E.runPromise(repository.fetchAll());
      expect(allUsers).toHaveLength(10);

      // Verify all user IDs are present
      const addedIds = users.map((u) => u.id).sort();
      const fetchedIds = allUsers.map((u) => u.id).sort();
      expect(fetchedIds).toEqual(addedIds);
    });
  });
});
