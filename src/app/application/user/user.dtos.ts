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

// DTO Types
export type CreateUserDto = S.Schema.Type<typeof CreateUserDtoSchema>;
export type UpdateUserDto = S.Schema.Type<typeof UpdateUserDtoSchema>;
export type RemoveUserDto = S.Schema.Type<typeof RemoveUserDtoSchema>;
export type UserBasicViewDto = S.Schema.Type<typeof UserBasicViewDtoSchema>;
export type UsersPaginationDto = S.Schema.Type<typeof UsersPaginationDtoSchema>;
export type UserIdParam = S.Schema.Type<typeof UserIdSchema>;


