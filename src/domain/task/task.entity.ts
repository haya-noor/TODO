import { Effect as E, pipe, Schema as S, ParseResult } from "effect";
import { BaseEntity, IEntity } from "../utils/base.entity";
import { TaskSchema, Task as TaskType, SerializedTask } from "./task.schema";
import { TaskValidationError, TaskMutationError } from "./task.errors";
import type { TaskId, UserId } from "../brand/ids";
import type { UUID, DateTime } from "../brand/types";
import { Option } from "effect/Option";

/**
 * Task Entity
 * 
 * Represents a task in the TODO domain with:
 * - Title and optional description
 * - Status tracking (TODO, IN_PROGRESS, DONE)
 * - Assignment to a user
 */
export class Task extends BaseEntity implements IEntity {
  
  // Entity properties
  readonly taskId: TaskId;
  readonly title: string;
  readonly description: Option<string>;
  readonly status: "TODO" | "IN_PROGRESS" | "DONE";
  readonly assigneeId: UserId;

  /**
   * Private constructor - use Task.create() to instantiate
   */
  private constructor(data: TaskType) {
    super();
    this._fromSerialized({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
    
    this.taskId = data.id;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.assigneeId = data.assigneeId;
  }

  /**
   * Create a Task entity from serialized data
   * 
   * Validates the input using TaskSchema and TaskGuards
   * Returns an Effect that succeeds with a Task or fails with TaskValidationError
   */
  static create(input: SerializedTask): E.Effect<Task, TaskValidationError, never> {
    return pipe(
      S.decodeUnknown(TaskSchema)(input),
      E.map((data) => new Task(data)),
      E.mapError((error) => 
        new TaskValidationError(
          "Failed to create Task entity",
          "task",
          input,
          { parseError: error.message }
        )
      )
    );
  }

  /**
   * Serialize the Task entity back to its encoded representation
   * 
   * Returns an Effect that succeeds with SerializedTask
   */
  serialized(): E.Effect<SerializedTask, ParseResult.ParseError, never> {
    return S.encode(TaskSchema)({
      id: this.taskId,
      title: this.title,
      description: this.description,
      status: this.status,
      assigneeId: this.assigneeId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    });
  }

  /**
   * Update the task's title
   * 
   * Returns a new Task instance with the updated title
   */
  updateTitle(newTitle: string): E.Effect<Task, TaskValidationError, never> {
    return this.serialized().pipe(
      E.flatMap((currentSerialized) => {
        const updatedData: SerializedTask = {
          ...currentSerialized,
          title: newTitle,
          updatedAt: new Date()
        };
        return Task.create(updatedData);
      }),
      E.mapError((error) => 
        new TaskValidationError(
          "Failed to update task title",
          "title",
          newTitle
        )
      )
    );
  }

  /**
   * Update the task's description
   * 
   * Returns a new Task instance with the updated description
   */
  updateDescription(newDescription: string | undefined): E.Effect<Task, TaskValidationError, never> {
    return this.serialized().pipe(
      E.flatMap((currentSerialized) => {
        const updatedData: SerializedTask = {
          ...currentSerialized,
          description: newDescription,
          updatedAt: new Date()
        };
        return Task.create(updatedData);
      }),
      E.mapError((error) => 
        new TaskValidationError(
          "Failed to update task description",
          "description",
          newDescription
        )
      )
    );
  }

  /**
   * Update the task's status
   * 
   * Returns a new Task instance with the updated status
   */
  updateStatus(newStatus: "TODO" | "IN_PROGRESS" | "DONE"): E.Effect<Task, TaskValidationError, never> {
    return this.serialized().pipe(
      E.flatMap((currentSerialized) => {
        const updatedData: SerializedTask = {
          ...currentSerialized,
          status: newStatus,
          updatedAt: new Date()
        };
        return Task.create(updatedData);
      }),
      E.mapError((error) => 
        new TaskValidationError(
          "Failed to update task status",
          "status",
          newStatus
        )
      )
    );
  }

 

  // /**
  //  * Mark the task as in progress
  //  */
  // markInProgress(): E.Effect<Task, TaskValidationError, never> {
  //   return this.updateStatus("IN_PROGRESS");
  // }

  // /**
  //  * Mark the task as done
  //  */
  // markDone(): E.Effect<Task, TaskValidationError, never> {
  //   return this.updateStatus("DONE");
  // }

  // /**
  //  * Mark the task as todo
  //  */
  // markTodo(): E.Effect<Task, TaskValidationError, never> {
  //   return this.updateStatus("TODO");
  // }

  // /**
  //  * Check if the task is assigned to a specific user
  //  */
  // isAssignedTo(userId: UserId): boolean {
  //   return this.assigneeId === userId;
  // }

  // /**
  //  * Check if the task is completed
  //  */
  // isCompleted(): boolean {
  //   return this.status === "DONE";
  // }

  // /**
  //  * Check if the task is in progress
  //  */
  // isInProgress(): boolean {
  //   return this.status === "IN_PROGRESS";
  // }
}
