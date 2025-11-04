import { MutationError } from "../domain/utils/base.errors";

/**
 * Serialization Error - occurs when converting entity to database format
 */
export class SerializationError extends MutationError {
  tag = "SerializationError" as const;
  code = "SERIALIZATION_ERROR" as const;

  constructor(
    message: string,
    public readonly entityType: string,
    public readonly entityId?: string,
    details?: Record<string, unknown>
  ) {
    super("add", message, entityType, entityId, details);
  }
}

/**
 * Deserialization Error - occurs when converting database row to entity
 */
export class DeserializationError extends MutationError {
  tag = "DeserializationError" as const;
  code = "DESERIALIZATION_ERROR" as const;

  constructor(
    message: string,
    public readonly entityType: string,
    public readonly rowData?: unknown,
    details?: Record<string, unknown>
  ) {
    super("add", message, entityType, undefined, { rowData, ...details });
  }
}

