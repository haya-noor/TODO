import { Schema as S } from "effect";

import { UserSchema, type SerializedUser } from "../../domain/user/user.schema";
import { UserIdSchema } from "../../domain/brand/ids";
import { PaginationOptions } from "../../domain/utils/pagination";

// Create (add) DTO: client provides fields (no id/timestamps)
export const CreateUserDtoSchema = UserSchema.pick("name", "email", "password");

// Update DTO: id required, other fields optional (partial update)
export const UpdateUserDtoSchema = S.Struct({
  id: UserSchema.fields.id,  })
  .pipe( S.extend(S.partial(UserSchema.pick("name", "email", "password"))));

// Remove DTO: id only
export const RemoveUserDtoSchema = UserSchema.pick("id");

// View (fetch) DTO (basic): do not expose password
export const UserBasicViewDtoSchema = UserSchema.omit("password");

// Pagination DTO (reuse shared schema)
export const UsersPaginationDtoSchema = PaginationOptions;

// Response DTOs
// UserResponseDtoSchema is used as a response for the createUserDto (create)
export const UserResponseDtoSchema = S.Struct({
  success: S.Boolean,
  data: S.Any,
});

// UsersListResponseDtoSchema is used as a response for the getUsersDto (fetch)
export const UsersListResponseDtoSchema = S.Struct({
  data: S.Array(S.Any),
  pagination: S.Any, // Pagination structure
});

// UserRemoveResponseDtoSchema is used as a response for the removeUserDto (delete) with success flag
export const UserRemoveResponseDtoSchema = S.Struct({
  success: S.Boolean,
  id: S.String,
});

// DTO Types
export type CreateUserDto = S.Schema.Type<typeof CreateUserDtoSchema>;
export type UpdateUserDto = S.Schema.Type<typeof UpdateUserDtoSchema>;
export type RemoveUserDto = S.Schema.Type<typeof RemoveUserDtoSchema>;
export type UserBasicViewDto = S.Schema.Type<typeof UserBasicViewDtoSchema>;
export type UsersPaginationDto = S.Schema.Type<typeof UsersPaginationDtoSchema>;
export type UserIdParam = S.Schema.Type<typeof UserIdSchema>;

// Response DTO Types
export type UserResponseDto = S.Schema.Type<typeof UserResponseDtoSchema>;
export type UsersListResponseDto = S.Schema.Type<typeof UsersListResponseDtoSchema>;
export type UserRemoveResponseDto = S.Schema.Type<typeof UserRemoveResponseDtoSchema>;


