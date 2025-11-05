import { Schema as S } from "effect";
import { UserBasicViewDtoSchema } from "./user.dtos";
import { createPaginatedDataSchema } from "../../domain/utils/pagination";

// create, update response 
export const UserResponseDtoSchema = S.Struct({
  success: S.Boolean,
  data: UserBasicViewDtoSchema, // Properly typed as User (without password)
  token: S.optional(S.String), // JWT token (only included in create response)
});

// list response (fetch) with pagination 
export const UsersListResponseDtoSchema = createPaginatedDataSchema(UserBasicViewDtoSchema);

// remove (delete) response
export const UserRemoveResponseDtoSchema = S.Struct({
  success: S.Boolean,
  id: S.String,
});

// Response DTO Types
export type UserResponseDto = S.Schema.Type<typeof UserResponseDtoSchema>;
export type UsersListResponseDto = S.Schema.Type<typeof UsersListResponseDtoSchema>;
export type UserRemoveResponseDto = S.Schema.Type<typeof UserRemoveResponseDtoSchema>;

