import { describe, it, expect } from "vitest";
import * as UserRoutes from "@presentation/orpc-routes/user.routes";
import { makeCtx, callProc, makeBearer } from "../orpc.setup";

describe("User | update", () => {
  it("updates a user (authenticated)", async () => {
    // First create a user
    const createInput = { name: "Alice", email: `alice+${Date.now()}@test.com`, password: "Secret#123" };
    const createCtx = makeCtx();
    const created = await callProc<typeof createInput, { success: boolean; data: any }>(
      UserRoutes.create,
      createInput,
      createCtx
    );
    const userId = created.data.id;

    // Update the user
    const updateInput = { id: userId, name: "Alice Updated" };
    const ctx = makeCtx({ Authorization: makeBearer() });

    const out = await callProc<typeof updateInput, { success: boolean; data: any }>(
      UserRoutes.update,
      updateInput,
      ctx
    );

    expect(out.success).toBe(true);
    expect(out.data.name).toBe("Alice Updated");
    expect(out.data.id).toBe(userId);
    expect(out.data).not.toHaveProperty("password");
  });

  it("rejects invalid payload (missing id)", async () => {
    const bad = { name: "Should Fail" } as any;
    const ctx = makeCtx({ Authorization: makeBearer() });

    await expect(
      callProc<typeof bad, any>(UserRoutes.update, bad, ctx)
    ).rejects.toThrow();
  });
});

