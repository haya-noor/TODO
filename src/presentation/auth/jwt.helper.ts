// Handles JWT token parsing, extraction, and generation
// decodes payload from JWT token  
// generates JWT tokens for authenticated users

export interface JWTPayload {
  userId?: string;
  id?: string;
  role?: "assignee" | "admin"; 
  email?: string;
}

/**
 * Parse JWT token 
 * input: token - JWT token string
 * returns: Decoded payload
 * throws: Error if token is invalid
 * - the token is a string that is separated by a dot (.)
 * - the first part is the header, the second part is the payload, the third part is the signature
 * - the header contains the algorithm used to sign the token, the payload contains the user information
 * - the signature is used to verify the token
 * - we need to parse the token to get the user information

 const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  parse the payload part of the token to get the user information. 
  Buffer.from(parts[1], "base64url") → decodes that one segment from base64url to UTF-8 JSON
  JSON.parse(...) → turns it into an object (e.g., { userId: "123", role: "admin", email: "a@b.com" })

 */
export const parseJWT = (token: string): JWTPayload => {
  const parts = token.split(".");
  
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }
  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf-8")
  );
  return payload as JWTPayload;
};

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 * input: authHeader - Authorization header value from the HTTP request headers, headers can be 
 * string or an array of strings or undefined 
 * authHeader: Bearer <token> :   <token> is the JWT token
 * returns: Token string or null
 */
export const extractTokenFromHeader = (authHeader?: string | string[]): string | null => {
  if (!authHeader) {return null;}
  
  // if the header is an array, get the first element, if the header is a string, get the string
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  
  // if the header value is undefined, return null 
  if (!headerValue) {return null;}
  
  // Extract token from "Bearer <token>" format, if the header value is not in the format of 
  // "Bearer <token>", return null
  const match = headerValue.match(/^Bearer\s+(.+)$/i);

  return match ? match[1] : null;
};

/**
 * Generate JWT token for a user
 * Creates a JWT token with user information in the payload
 * 
 * @param userId - User ID
 * @param email - User email
 * @param role - User role (defaults to "assignee")
 * @returns JWT token string
 * 
 * Note: This implementation uses "none" algorithm for simplicity.
 * In production, you should use a proper signing algorithm (HS256, RS256, etc.)
 * and verify tokens with a secret key.
 */
export const generateJWT = (
  userId: string,
  email?: string,
  role: "assignee" | "admin" = "assignee"
): string => {
  // Create JWT header
  const header = {
    alg: "none",
    typ: "JWT"
  };

  // Create JWT payload with user information
  const payload: JWTPayload = {
    userId,
    id: userId,
    role,
    email
  };

  // Encode header and payload to base64url
  const encodeBase64Url = (obj: object): string => {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64url");
  };

  const encodedHeader = encodeBase64Url(header);
  const encodedPayload = encodeBase64Url(payload);

  // Create token (no signature for "none" algorithm)
  // Format: header.payload.signature
  const token = `${encodedHeader}.${encodedPayload}.sig`;

  return token;
};

