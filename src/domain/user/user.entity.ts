import { Effect as E, pipe, Schema as S, ParseResult } from "effect";
import { BaseEntity, IEntity } from "../utils/base.entity";
import { UserSchema, User as UserType, SerializedUser } from "./user.schema";
import { UserValidationError, UserMutationError } from "./user.errors";
import type { UserId } from "../brand/ids";
import type { UUID, DateTime } from "../brand/types";

/**
 * User Entity
 * 
 * Represents a user in the TODO domain with:
 * - Name for identification
 * - Email for authentication and communication
 * - Password for authentication
 */
export class User extends BaseEntity implements IEntity {
  
  // User-specific properties (id, createdAt, updatedAt inherited from BaseEntity)
  readonly name: string;
  readonly email: string;
  readonly password: string;

  /**
   * Private constructor - use User.create() to instantiate
   */
  private constructor(data: UserType) {
    super();
    this._fromSerialized({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
    
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
  }

  /**
   * Create a User entity from serialized data
   * 
   * Validates the input using UserSchema and UserGuards
   * Returns an Effect that succeeds with a User or fails with UserValidationError
   */
  static create(input: SerializedUser): E.Effect<User, UserValidationError, never> {
    return pipe(
      S.decodeUnknown(UserSchema)(input),
      E.map((data) => new User(data)),
      E.mapError((error) => 
        new UserValidationError(
          "Failed to create User entity",
          "user",
          input,
          { parseError: error.message }
        )
      )
    );
  }

  /**
   * Serialize the User entity back to its encoded representation
   * 
   * Uses automatic serialization with type safety by encoding 'this' directly.
   * The type assertion is safe because the entity structure matches the schema,
   * and the schema will apply the correct brands during encoding.
   * 
   * Returns an Effect that succeeds with SerializedUser
   */
  serialized(): E.Effect<SerializedUser, ParseResult.ParseError, never> {
    return S.encode(UserSchema)(this as UserType);
  }

  /**
   * Update the user's name
   * 
   * Returns a new User instance with the updated name
   */
  updateName(newName: string): E.Effect<User, UserValidationError, never> {
    return this.serialized().pipe(
      E.flatMap((currentSerialized) => {
        const updatedData: SerializedUser = {
          ...currentSerialized,
          name: newName,
          updatedAt: new Date()
        };
        return User.create(updatedData);
      }),
      E.mapError((error) => 
        new UserValidationError(
          "Failed to update user name",
          "name",
          newName
        )
      )
    );
  }

  /**
   * Update the user's email
   * 
   * Returns a new User instance with the updated email
   */
  updateEmail(newEmail: string): E.Effect<User, UserValidationError, never> {
    return this.serialized().pipe(
      E.flatMap((currentSerialized) => {
        const updatedData: SerializedUser = {
          ...currentSerialized,
          email: newEmail,
          updatedAt: new Date()
        };
        return User.create(updatedData);
      }),
      E.mapError((error) => 
        new UserValidationError(
          "Failed to update user email",
          "email",
          newEmail
        )
      )
    );
  }

  /**
   * Update the user's password
   * 
   * Returns a new User instance with the updated password
   */
  updatePassword(newPassword: string): E.Effect<User, UserValidationError, never> {
    return this.serialized().pipe(
      E.flatMap((currentSerialized) => {
        const updatedData: SerializedUser = {
          ...currentSerialized,
          password: newPassword,
          updatedAt: new Date()
        };
        return User.create(updatedData);
      }),
      E.mapError((error) => 
        new UserValidationError(
          "Failed to update user password",
          "password",
          newPassword
        )
      )
    );
  }

  /**
   * Check if the user has a specific ID
   */
  hasId(userId: UserId): boolean {
    return this.id === userId;
  }

  /**
   * Check if the user has a specific email
   */
  hasEmail(email: string): boolean {
    return this.email.toLowerCase() === email.toLowerCase();
  }

}

