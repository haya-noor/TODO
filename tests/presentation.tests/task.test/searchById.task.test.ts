import { describe, it, expect } from "vitest";
import * as TaskRoutes from "@presentation/orpc-routes/task.routes";
import * as UserRoutes from "@presentation/orpc-routes/user.routes";
import { makeCtx, callProc, makeBearer } from "../orpc.setup";

describe("Task | searchById", () => {
  it("searches a task by id (authenticated)", async () => {
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
      title: "Task to Search", 
      description: "This is a comprehensive test description that provides enough detail to meet the minimum character requirement for task descriptions.", 
      status: "TODO" as const,
      assigneeId
    };
    const createCtx = makeCtx({ Authorization: makeBearer() });
    const created = await callProc<typeof createInput, { success: boolean; data: any }>(
      TaskRoutes.create,
      createInput,
      createCtx
    );
    const taskId = created.data.id;

    // Search the task by id
    const searchInput = { id: taskId };
    const ctx = makeCtx({ Authorization: makeBearer() });

    const out = await callProc<typeof searchInput, { success: boolean; data: any }>(
      TaskRoutes.getById,
      searchInput,
      ctx
    );

    expect(out.success).toBe(true);
    expect(out.data.id).toBe(taskId);
    expect(out.data.title).toBe("Task to Search");
  });

  it("rejects invalid payload (missing id)", async () => {
    const bad = {} as any;
    const ctx = makeCtx({ Authorization: makeBearer() });

    await expect(
      callProc<typeof bad, any>(TaskRoutes.getById, bad, ctx)
    ).rejects.toThrow();
  });
});

