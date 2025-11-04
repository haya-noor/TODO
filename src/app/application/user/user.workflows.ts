import "reflect-metadata";
import { Effect as E, pipe, Option as O, Schema as S } from "effect";
import { injectable, inject } from "tsyringe";

import { User } from "../../domain/user/user.entity";
import { UserRepository } from "../../domain/user/user.repository";
import { UserNotFoundError, UserValidationError, UserMutationError } from "../../domain/user/user.errors";
import type { PaginatedData } from "../../domain/utils/pagination";
import { UUID, DateTime } from "../../domain/brand/constructors";
import { UserIdSchema } from "../../domain/brand/ids";
import type { SerializedUser } from "../../domain/user/user.schema";
import { TOKENS } from "../../infra/di/tokens";

import {
  CreateUserDtoSchema, UpdateUserDtoSchema, RemoveUserDtoSchema, UsersPaginationDtoSchema,
  type CreateUserDto, type UpdateUserDto, type UsersPaginationDto,
} from "./user.dtos";

/*
1. User.create(serialized) - Domain Layer (In-Memory)
Validates business rules (name length, email format, etc.)
Constructs a User entity object
Runs in memory - NO database involved
Returns: Effect<User, ValidationError>

2. repo.add(entity) - Infrastructure Layer (Database)
Persists the entity to database
Executes SQL INSERT statement
Actual I/O operation
Returns: Effect<User, ValidationError>
*/




// createUserWorkflow
export const createUser = (repo: UserRepository) => (input: unknown): E.Effect<User, UserValidationError, never> =>
  pipe(S.decodeUnknown(CreateUserDtoSchema)(input),
    E.map((dto: CreateUserDto) => ({
      ...dto,
      id: UUID.init(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    })),
    E.flatMap((serialized) => User.create(serialized)),
    E.mapError(() => new UserValidationError("Invalid create user input", "user", input)),
    E.flatMap((entity) => repo.add(entity)),
    E.mapError(() => new UserValidationError("Failed to create user", "user", input))
  );


// updateUserWorkflow
export const updateUser = (repo: UserRepository) => (input: unknown): E.Effect<User, UserValidationError | UserNotFoundError, never> =>
  pipe(
    S.decodeUnknown(UpdateUserDtoSchema)(input),
    E.mapError(() => new UserValidationError("Invalid update user input", "user", input)),
    E.flatMap((dto: UpdateUserDto) =>
      pipe(repo.fetchById(dto.id), // fetch the user from the database (ensures the user exists)
        E.mapError(() => new UserNotFoundError(String(dto.id))),
        E.flatMap((maybe) =>
          O.match(maybe, {
            onNone: () => E.fail(new UserNotFoundError(String(dto.id))),
            onSome: (existing) => 
              pipe(existing.serialized(),E.mapError(() => new UserValidationError("Failed to serialize existing user", "user", input)))
          })
        ),
        E.map((current: SerializedUser) => ({
          ...current,
          ...dto,
          updatedAt: DateTime.now(),
        })),
        E.flatMap((nextSerialized) => User.create(nextSerialized)),
        E.mapError(() => new UserValidationError("Invalid user update payload", "user", input)),
        E.flatMap((updated) => pipe(
          repo.update(updated),
          E.mapError(() => new UserNotFoundError(String(dto.id)))
        ))))
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

  createUser(input: unknown): E.Effect<User, UserValidationError, never> {
    return createUser(this.repo)(input);
  }

  updateUser(input: unknown): E.Effect<User, UserValidationError | UserNotFoundError, never> {
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


