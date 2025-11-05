import { describe, it, expect } from "vitest";
import * as UserRoutes from "@presentation/orpc-routes/user.routes";
import { makeCtx, callProc, makeBearer } from "../orpc.setup";

describe("User | remove", () => {
  it("removes a user (authenticated)", async () => {
    // First create a user
    const createInput = { name: "Bob", email: `bob+${Date.now()}@test.com`, password: "Secret#123" };
    const createCtx = makeCtx();
    const created = await callProc<typeof createInput, { success: boolean; data: any }>(
      UserRoutes.create,
      createInput,
      createCtx
    );
    const userId = created.data.id;

    // Remove the user
    const removeInput = { id: userId };
    const ctx = makeCtx({ Authorization: makeBearer() });

    const out = await callProc<typeof removeInput, { success: boolean; id: string }>(
      UserRoutes.remove,
      removeInput,
      ctx
    );

    expect(out.success).toBe(true);
    expect(out.id).toBe(userId);
  });

  it("rejects invalid payload (missing id)", async () => {
    const bad = {} as any;
    const ctx = makeCtx({ Authorization: makeBearer() });

    await expect(
      callProc<typeof bad, any>(UserRoutes.remove, bad, ctx)
    ).rejects.toThrow();
  });
});

