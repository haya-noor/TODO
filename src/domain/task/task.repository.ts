import { Effect as E, Option as O } from "effect";
import { BaseRepository, RepositoryEffect } from "../utils/base.repository";
import { Task } from "./task.entity";
import { PaginatedData, PaginationOptions } from "../utils/pagination";
import { PaginatedSearchParams } from "./task.schema";
import { ValidationError, QueryError, NotFoundError, MutationError } from "../utils/base.errors";
import type { IEntity } from "../utils/base.entity";


export abstract class TaskRepository extends BaseRepository<Task> {
 
  abstract add(entity: Task): RepositoryEffect<Task, ValidationError>;

 
  abstract update(entity: Task): RepositoryEffect<Task, NotFoundError>;

 
  abstract fetchAll(): RepositoryEffect<Task[], QueryError>;


  abstract fetchById(id: IEntity["id"]): RepositoryEffect<O.Option<Task>, QueryError>;


  abstract deleteById(id: IEntity["id"]): RepositoryEffect<Task, NotFoundError | MutationError>;
  
  // fetchPaginated(options: PaginationOptions): RepositoryEffect<PaginatedData<Task>>;

  
  abstract search(
    params: PaginatedSearchParams
  ): RepositoryEffect<PaginatedData<Task>, ValidationError | QueryError>;
}

