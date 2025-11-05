import { describe, it, expect } from "vitest";
import * as TaskRoutes from "@presentation/orpc-routes/task.routes";
import * as UserRoutes from "@presentation/orpc-routes/user.routes";
import { makeCtx, callProc, makeBearer } from "../orpc.setup";

describe("Task | search", () => {
  it("searches tasks with pagination (authenticated)", async () => {
    // First create a user to use as assignee
    const createUserInput = { name: "Assignee", email: `assignee+${Date.now()}@test.com`, password: "Secret#123" };
    const createUserCtx = makeCtx();
    const createdUser = await callProc<typeof createUserInput, { success: boolean; data: any }>(
      UserRoutes.create,
      createUserInput,
      createUserCtx
    );
    const assigneeId = createdUser.data.id;

    // Create a task
    const createInput = { 
      title: "Searchable Task", 
      description: "This is a comprehensive test description that provides enough detail to meet the minimum character requirement for task descriptions.", 
      status: "TODO" as const,
      assigneeId
    };
    const createCtx = makeCtx({ Authorization: makeBearer() });
    await callProc<typeof createInput, { success: boolean; data: any }>(
      TaskRoutes.create,
      createInput,
      createCtx
    );

    // Search tasks
    const searchInput = { page: 1, limit: 10 };
    const ctx = makeCtx({ Authorization: makeBearer() });

    const out = await callProc<typeof searchInput, { data: any[]; pagination: any }>(
      TaskRoutes.search,
      searchInput,
      ctx
    );

    expect(out.data).toBeInstanceOf(Array);
    expect(out.pagination).toBeDefined();
    expect(out.pagination.page).toBe(1);
    expect(out.pagination.limit).toBe(10);
  });

  it("rejects invalid payload (missing page)", async () => {
    const bad = { limit: 10 } as any;
    const ctx = makeCtx({ Authorization: makeBearer() });

    await expect(
      callProc<typeof bad, any>(TaskRoutes.search, bad, ctx)
    ).rejects.toThrow();
  });
});

