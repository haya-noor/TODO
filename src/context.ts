// src/context.ts

/*
Creates BaseContext from HTTP req and res
Used by server.ts to create context from real HTTP requests
*/
import type { BaseContext } from "./presentation/auth/auth.middleware";

export const createContext = ({ req, res }: { req: any; res: any }): BaseContext => ({
    headers: req.headers,
  });
  