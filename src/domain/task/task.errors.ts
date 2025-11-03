
import { ValidationError } from "../utils/base.errors"
import { NotFoundError } from "../utils/base.errors"
import { MutationError } from "../utils/base.errors"

// extend the base errors for the task domain

export class TaskValidationError extends ValidationError {
  tag = "TaskValidationError"
  code = "TASK_VALIDATION_ERROR"
}

export class TaskNotFoundError extends NotFoundError {
  tag = "TaskNotFoundError"
  code = "TASK_NOT_FOUND"
}


export class TaskMutationError extends MutationError {
  tag = "TaskMutationError"
  code = "TASK_MUTATION_ERROR"
}