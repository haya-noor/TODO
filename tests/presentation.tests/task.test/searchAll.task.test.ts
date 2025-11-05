import { describe, it, expect } from "vitest";
import * as TaskRoutes from "@presentation/orpc-routes/task.routes";
import * as UserRoutes from "@presentation/orpc-routes/user.routes";
import { makeCtx, callProc, makeBearer } from "../orpc.setup";

describe("Task | searchAll", () => {
  it("searches all tasks (authenticated)", async () => {
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
      title: "Test Task", 
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

    // Search all tasks
    const ctx = makeCtx({ Authorization: makeBearer() });

    const out = await callProc<undefined, { success: boolean; data: any[] }>(
      TaskRoutes.getAll,
      undefined,
      ctx
    );

    expect(out.success).toBe(true);
    expect(out.data).toBeInstanceOf(Array);
  });
});

