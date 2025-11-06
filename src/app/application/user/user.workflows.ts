import "reflect-metadata";
import { Effect as E, pipe, Option as O, Schema as S } from "effect";
import { injectable, inject } from "tsyringe";

import { User } from "../../domain/user/user.entity";
import { UserRepository } from "../../domain/user/user.repository";
import { UserNotFoundError, UserValidationError, UserMutationError } from "../../domain/user/user.errors";
import type { PaginatedData } from "../../domain/utils/pagination";
import { UUID, DateTime } from "../../domain/brand/constructors";
import { UserId, UserIdSchema } from "../../domain/brand/ids";
import type { SerializedUser } from "../../domain/user/user.schema";
import { TOKENS } from "../../infra/di/tokens";

import {
  CreateUserDtoSchema, UpdateUserDtoSchema, RemoveUserDtoSchema, UsersPaginationDtoSchema,
  type CreateUserDto, type UpdateUserDto, type UsersPaginationDto,
} from "./user.dtos";


export const createUser = (repo: UserRepository) => (input: CreateUserDto): E.Effect<User, UserValidationError, never> =>
  pipe(
    E.succeed({
      ...input,
      id: UserId.fromTrusted(UUID.init()),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    }),
    E.flatMap((data: SerializedUser) => User.create(data)),
    E.flatMap((entity) => repo.add(entity)),
  )


export const updateUser = (repo: UserRepository) => (input: UpdateUserDto): E.Effect<SerializedUser, UserValidationError | UserNotFoundError, never> => 
    pipe(
    E.succeed(input),
    E.flatMap((data) =>
      pipe(
        repo.fetchById(UserId.fromTrusted(data.id)),
        E.mapError(() => new UserNotFoundError(String(data.id))),
        E.flatMap((maybe) =>
          O.match(maybe, {
            onNone: () => E.fail(new UserNotFoundError(String(data.id))),
            onSome: (existing) => pipe(
              existing.serialized(), 
              E.mapError(() => new UserValidationError("Failed to serialize existing user", "user", input))
            )})
        ),
        E.map((current) => {
          const updated: SerializedUser = {
            ...current,
            ... data,
            updatedAt: DateTime.now()
          };
          return updated;
        }),
        E.flatMap((nextSerialized) => User.create(nextSerialized)),
        E.mapError(() => new UserValidationError("Invalid user update payload", "user", input)),
        E.flatMap((updated) => repo.update(updated)),
        E.flatMap((updatedEntity) => updatedEntity.serialized()),
        E.mapError(() => new UserValidationError("Failed to serialize updated user", "user", input)),
      )
    )
  );

// getAllUsersWorkflow
export const getAllUsers = (repo: UserRepository): E.Effect<User[], UserValidationError, never> =>
  pipe(repo.fetchAll(), E.mapError(() => new UserValidationError("Failed to fetch users")));



// getUserByIdWorkflow: return NotFound if none
export const getUserById = (repo: UserRepository) => (id: unknown): E.Effect<User, UserValidationError | UserNotFoundError, never> =>
  pipe(S.decodeUnknown(UserIdSchema)(id),
    E.mapError(() => new UserValidationError("Invalid user id", "id", id)),
    E.flatMap((validId) =>
      pipe(
        repo.fetchById(validId),
        E.mapError(() => new UserNotFoundError(String(id))),
        E.flatMap((maybe) =>
          O.match(maybe, {
            onNone: () => E.fail(new UserNotFoundError(String(id))),
            onSome: (user) => E.succeed(user),})))));


// removeUserWorkflow
export const deleteUserById = (repo: UserRepository) => (input: unknown): E.Effect<User, UserValidationError | UserNotFoundError, never> =>
  pipe(S.decodeUnknown(RemoveUserDtoSchema)(input),
    E.mapError(() => new UserValidationError("Invalid user id", "id", input)),
    E.flatMap((dto) => 
      pipe(repo.deleteById(dto.id),E.mapError(() => new UserNotFoundError("Failed to delete user", "User", dto.id))
)));


// getUsersPaginatedWorkflow
export const getUsersPaginated = (repo: UserRepository) => (input: unknown): E.Effect<PaginatedData<User>, UserValidationError, never> =>
  pipe(S.decodeUnknown(UsersPaginationDtoSchema)(input),
    E.mapError(() => new UserValidationError("Invalid pagination params")),
    E.flatMap((options: UsersPaginationDto) => 
      pipe(
        repo.fetchPaginated(options),
        E.mapError(() => new UserValidationError("Failed to fetch paginated users"))
)));

/**
 * UserWorkflow Class
 * Injectable workflow class that wraps functional workflows
 * This allows workflows to be resolved from DI container with repository already injected
 */
@injectable()
export class UserWorkflow {
  constructor(@inject(TOKENS.USER_REPOSITORY) private readonly repo: UserRepository) {}

  createUser(input: CreateUserDto): E.Effect<User, UserValidationError, never> {
    return createUser(this.repo)(input);
  }

  updateUser(input: UpdateUserDto): E.Effect<SerializedUser, UserValidationError | UserNotFoundError, never> {
    return updateUser(this.repo)(input);
  }

  deleteUserById(input: unknown): E.Effect<User, UserValidationError | UserNotFoundError, never> {
    return deleteUserById(this.repo)(input);
  }

  getAllUsers(): E.Effect<User[], UserValidationError, never> {
    return getAllUsers(this.repo);
  }

  getUserById(id: unknown): E.Effect<User, UserValidationError | UserNotFoundError, never> {
    return getUserById(this.repo)(id);
  }

  getUsersPaginated(input: unknown): E.Effect<PaginatedData<User>, UserValidationError, never> {
    return getUsersPaginated(this.repo)(input);
  }
}


