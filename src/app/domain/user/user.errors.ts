
import { ValidationError } from "../utils/base.errors"
import { NotFoundError } from "../utils/base.errors"
import { MutationError } from "../utils/base.errors"

// extend the base errors for the user domain

export class UserValidationError extends ValidationError {
  tag = "UserValidationError"
  code = "USER_VALIDATION_ERROR"
}

export class UserNotFoundError extends NotFoundError {
  tag = "UserNotFoundError"
  code = "USER_NOT_FOUND"
}


export class UserMutationError extends MutationError {
  tag = "UserMutationError"
  code = "USER_MUTATION_ERROR"
}

