import { ORPCError } from "@orpc/server";

// node:http is a built-in module in node.js that provides a way to work with HTTP requests 
// and responses. It's used to get the headers from the HTTP request.
import type { IncomingHttpHeaders } from "node:http";

import { parseJWT, extractTokenFromHeader } from "./jwt.helper";

/**
 * Authentication Middleware for oRPC
 * Validates JWT tokens and enriches context with user information
 */


//Base context - initial context passed from HTTP request
export interface BaseContext {
  headers: IncomingHttpHeaders;
}

/**
 * Base context - initial context passed from HTTP request ( headers ) 
 * Authenticated context - contains validated user information (context) like id, role, email etc 
 * after authentication in the validateUser function
 * 
 * context.headers.authorization || context.headers.Authorization : 
 * HTTP headers are case-insensitive, so we need to check both. 
 */
export interface AuthenticatedContext extends BaseContext {
  user: {
    id: string;
    role: "assignee" | "admin";
    email?: string;
  };
}

export const validateUser = ({ context, next }: 
  { context: BaseContext;                        // initial context passed from HTTP request ( headers ) 
  next: (args: { context: AuthenticatedContext }) => any // next function to pass the authenticated context to the handler
}) => {
  // Extract token from Authorization header
  const token = extractTokenFromHeader(
context.headers.authorization || context.headers.Authorization
  );
  
  if (!token) {   throw new ORPCError("UNAUTHORIZED");}
  
  // Parse JWT token
  let payload;
  try {
    payload = parseJWT(token); // token here is the JWT token from the Authorization header 
  } catch (error) {
    throw new ORPCError("UNAUTHORIZED");
  }
  
  // Ensure user ID exists in token
  const userId = payload.userId || payload.id;
  if (!userId) {
    throw new ORPCError("UNAUTHORIZED");
  }
  
  // Build authenticated context with user information
  const authenticatedContext: AuthenticatedContext = {
    ...context,
    user: {
      id: userId,
      role: payload.role || "assignee", // check if role is specified in the token, Default to assignee if not specified
      email: payload.email,
    },
  };
  
  // Pass enriched context to next handler
  return next({ context: authenticatedContext });
};

