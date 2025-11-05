import { describe, it, expect } from "vitest";
import * as UserRoutes from "@presentation/orpc-routes/user.routes";
import { makeCtx, callProc, makeBearer } from "../orpc.setup";

describe("User | fetch", () => {
  it("fetches users with pagination (authenticated)", async () => {
    // Create a user first
    const createInput = { name: "Charlie", email: `charlie+${Date.now()}@test.com`, password: "Secret#123" };
    const createCtx = makeCtx();
    await callProc<typeof createInput, { success: boolean; data: any }>(
      UserRoutes.create,
      createInput,
      createCtx
    );

    // Fetch users
    const fetchInput = { page: 1, limit: 10 };
    const ctx = makeCtx({ Authorization: makeBearer() });

    const out = await callProc<typeof fetchInput, { data: any[]; pagination: any }>(
      UserRoutes.fetch,
      fetchInput,
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
      callProc<typeof bad, any>(UserRoutes.fetch, bad, ctx)
    ).rejects.toThrow();
  });
});

