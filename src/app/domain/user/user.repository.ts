import { Effect as E, Option as O } from "effect";
import { BaseRepository, RepositoryEffect } from "../utils/base.repository";
import { User } from "./user.entity";
import { PaginatedData, PaginationOptions } from "../utils/pagination";
import { ValidationError, QueryError, NotFoundError, MutationError } from "../utils/base.errors";
import type { IEntity } from "../utils/base.entity";


export abstract class UserRepository extends BaseRepository<User> {
  
  abstract add(entity: User): RepositoryEffect<User, ValidationError>;

  abstract update(entity: User): RepositoryEffect<User, NotFoundError>;

  abstract fetchAll(): RepositoryEffect<User[], QueryError>;

  abstract fetchPaginated(options: PaginationOptions): RepositoryEffect<PaginatedData<User>>;

  abstract fetchById(id: IEntity["id"]): RepositoryEffect<O.Option<User>, QueryError>;

  abstract deleteById(id: IEntity["id"]): RepositoryEffect<User, NotFoundError | MutationError>;
}

