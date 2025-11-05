import { describe, it, expect } from "vitest";
import * as UserRoutes from "@presentation/orpc-routes/user.routes";
import { makeCtx, callProc } from "../orpc.setup";

describe("User | create", () => {
  it("creates a user (public) and strips password", async () => {
    const input = { name: "Alice", email: `alice+${Date.now()}@test.com`, password: "Secret#123" };
    const ctx = makeCtx(); // public route

    const out = await callProc<typeof input, { success: boolean; data: any }>(
      UserRoutes.create,
      input,
      ctx
    );

    expect(out.success).toBe(true);
    expect(out.data.name).toBe("Alice");
    expect(out.data.email).toBe(input.email);
    expect(out.data).not.toHaveProperty("password");
    expect(out.data.id).toBeDefined();
  });

  it("rejects invalid payload (missing password)", async () => {
    const bad = { name: "Bob", email: `bob+${Date.now()}@test.com` } as any;
    const ctx = makeCtx();

    await expect(
      callProc<typeof bad, any>(UserRoutes.create, bad, ctx)
    ).rejects.toThrow(); // oRPC should throw on schema validation
  });
});

