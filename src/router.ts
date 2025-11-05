
/*
Creates the oRPC router with all routes (user.create, user.update, task.create, etc.)
Exports the handler (RPCHandler instance)
*/
import { os } from "@orpc/server";
import { RPCHandler } from "@orpc/server/node";
import type { BaseContext } from "./presentation/auth/auth.middleware";
import * as UserRoutes from "./presentation/orpc-routes/user.routes";
import * as TaskRoutes from "./presentation/orpc-routes/task.routes";

const router = os.router({
  user: {
    create: UserRoutes.create,
    update: UserRoutes.update,
    fetch: UserRoutes.fetch,
    remove: UserRoutes.remove,
  },
  task: {
    create: TaskRoutes.create,
    update: TaskRoutes.update,
    remove: TaskRoutes.remove,
    fetch: TaskRoutes.fetch,
    getById: TaskRoutes.getById,
    getAll: TaskRoutes.getAll,
    search: TaskRoutes.search,
  },
} as any);

// This is the correct handler object with BaseContext type
export const handler = new RPCHandler<BaseContext>(router as any);
