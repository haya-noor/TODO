import { Effect as E, pipe, Option as O, Schema as S } from "effect";

import { User } from "../../domain/user/user.entity";
import { UserRepository } from "../../domain/user/user.repository";
import { QueryError } from "../../domain/utils/base.errors";
import { UserNotFoundError, UserValidationError } from "../../domain/user/user.errors";
import type { PaginatedData } from "../../domain/utils/pagination";
import { UUID, DateTime } from "../../domain/brand/constructors";
import type { SerializedUser } from "../../domain/user/user.schema";

import {
  CreateUserDtoSchema,
  UpdateUserDtoSchema,
  RemoveUserDtoSchema,
  UsersPaginationDtoSchema,
  type CreateUserDto,
  type UpdateUserDto,
  type UsersPaginationDto,
} from "./dtos";
import { UserIdSchema } from "../../domain/brand/ids";

// createUserWorkflow
export const createUser = (repo: UserRepository) => (
  input: unknown
) => {
  const entityEffect = pipe(
    S.decodeUnknown(CreateUserDtoSchema)(input),
    E.map((dto: CreateUserDto) => ({
      ...dto,
      id: UUID.init(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    })),
    E.flatMap((serialized) => User.create(serialized)),
    E.mapError(() => new UserValidationError("Invalid create user input", "user", input))
  );

  return pipe(entityEffect, E.flatMap((entity) => repo.add(entity)));
};

// updateUserWorkflow
export const updateUser = (repo: UserRepository) => (
  input: unknown
) =>
  pipe(
    S.decodeUnknown(UpdateUserDtoSchema)(input),
    E.mapError(() => new UserValidationError("Invalid update user input", "user", input)),
    E.flatMap((dto: UpdateUserDto) =>
      pipe(
        repo.fetchById(dto.id),
        E.flatMap((maybe) =>
          O.match(maybe, {
            onNone: () => E.fail(new UserNotFoundError(String(dto.id))),
            onSome: (existing) => 
              pipe(
                existing.serialized(),
                E.mapError(() => new UserValidationError("Failed to serialize existing user", "user", input))
              )
          })
        ),
        E.map((current: SerializedUser) => ({
          ...current,
          ...dto,
          updatedAt: DateTime.now(),
        })),
        E.flatMap((nextSerialized) => User.create(nextSerialized)),
        E.mapError(() => new UserValidationError("Invalid user update payload", "user", input)),
        E.flatMap((updated) => repo.update(updated))
      )
    )
  );

// getAllUsersWorkflow
export const getAllUsers = (repo: UserRepository) => repo.fetchAll();

// getUserByIdWorkflow: return NotFound if none
export const getUserById = (repo: UserRepository) => (id: unknown) =>
  pipe(
    S.decodeUnknown(UserIdSchema)(id),
    E.mapError(() => new UserValidationError("Invalid user id", "id", id)),
    E.flatMap((validId) =>
      pipe(
        repo.fetchById(validId),
        E.flatMap((maybe) =>
          O.match(maybe, {
            onNone: () => E.fail(new UserNotFoundError(String(id))),
            onSome: (user) => E.succeed(user),
          })
        )
      )
    )
  );

// removeUserWorkflow
export const deleteUserById = (repo: UserRepository) => (input: unknown) =>
  pipe(
    S.decodeUnknown(RemoveUserDtoSchema)(input),
    E.mapError(() => new UserValidationError("Invalid user id", "id", input)),
    E.flatMap((dto) => repo.deleteById(dto.id))
  );

// getUsersPaginatedWorkflow
export const getUsersPaginated = (repo: UserRepository) => (
  input: unknown
) =>
  pipe(
    S.decodeUnknown(UsersPaginationDtoSchema)(input),
    E.mapError(() => new UserValidationError("Invalid pagination params")),
    E.flatMap((options: UsersPaginationDto) => repo.fetchPaginated(options))
  );


