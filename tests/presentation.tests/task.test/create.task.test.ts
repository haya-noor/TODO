import { describe, it, expect } from "vitest";
import * as TaskRoutes from "@presentation/orpc-routes/task.routes";
import * as UserRoutes from "@presentation/orpc-routes/user.routes";
import { makeCtx, callProc, makeBearer } from "../orpc.setup";

describe("Task | create", () => {
  it("creates a task (authenticated)", async () => {
    // First create a user to use as assignee
    const createUserInput = { name: "Assignee", email: `assignee+${Date.now()}@test.com`, password: "Secret#123" };
    const createUserCtx = makeCtx();
    const createdUser = await callProc<typeof createUserInput, { success: boolean; data: any }>(
      UserRoutes.create,
      createUserInput,
      createUserCtx
    );
    expect(createdUser.success).toBe(true);
    expect(createdUser.data.id).toBeDefined();
    
    const input = { 
      title: "Test Task", 
      description: "This is a comprehensive test description that provides enough detail to meet the minimum character requirement for task descriptions.", 
      status: "TODO",
      assigneeId: createdUser.data.id
    };
    const ctx = makeCtx({ Authorization: makeBearer() });

    const out = await callProc<typeof input, { success: boolean; data: any }>(
      TaskRoutes.create,
      input,
      ctx
    );

    expect(out.success).toBe(true);
    expect(out.data.title).toBe("Test Task");
    const description = out.data.description?._tag === "Some" ? out.data.description.value : out.data.description;
    expect(description).toBe("This is a comprehensive test description that provides enough detail to meet the minimum character requirement for task descriptions.");
    expect(out.data.status).toBe("TODO");
    expect(out.data.id).toBeDefined();
  });

  it("rejects invalid payload (missing title)", async () => {
    // First create a user to use as assignee
    const createUserInput = { name: "Assignee", email: `assignee2+${Date.now()}@test.com`, password: "Secret#123" };
    const createUserCtx = makeCtx();
    const createdUser = await callProc<typeof createUserInput, { success: boolean; data: any }>(
      UserRoutes.create,
      createUserInput,
      createUserCtx
    );
    const assigneeId = createdUser.data.id;

    const bad = { 
      description: "This is a comprehensive test description that provides enough detail to meet the minimum character requirement for task descriptions.", 
      status: "TODO" as const,
      assigneeId
    } as any;
    const ctx = makeCtx({ Authorization: makeBearer() });

    await expect(
      callProc<typeof bad, any>(TaskRoutes.create, bad, ctx)
    ).rejects.toThrow();
  });
});

