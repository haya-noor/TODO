import { Effect as E, Schema as S } from "effect";

/**
 * Route Utility Functions
 * Shared helpers for route handlers across different entities
 */

/**
 * Convert Effect Schema to Standard Schema format for oRPC
 * oRPC supports Standard Schema spec, and Effect Schema can be converted using standardSchemaV1
 * input: schema: S.Schema<A, I, never> - the Effect schema to convert
 * output: StandardSchemaV1<I, A> - the standard schema format that oRPC accepts
 * 
 * we need to convert the Effect schema to the Standard schema format for oRPC to accept and
 * our end to end validation to work. 
 */
export const toStandard = <A, I>(schema: S.Schema<A, I, never>) => 
  S.standardSchemaV1(schema);

/**
 * Enrich input with actor information from context
 * Adds actorId and actorRole from the authenticated user context
 * This function is used to enrich the input with the actor information from the context.
 * 
 * input: input: any - we'll get the input from the HTTP request body
 * 
 * context: any - the context to enrich the input with (we'll get the context from the 
 * HTTP request headers, which contains the user information)
 * 
 * output: returns the enriched input with the actor information from the context 
 */
export const withActor = (input: any, context: any) => ({
  ...input,
  actorId: context.user?.id,
  actorRole: context.user?.role, // assignee or admin 
});

/**
 * Execute Effect and handle errors
 * Converts an Effect into a Promise for use in async handlers
 * input: effect: E.Effect<T, any, never> - the effect to execute
 * output: T - the result of the effect
 * 
 * This executeEffect function is used to execute any effect and return the result.
 */
export const executeEffect = async <T>(effect: E.Effect<T, any, never>): Promise<T> => {
  return await E.runPromise(effect);
};

/**
 * Serialize entity using its built-in serialized() method
 * Generic function that works with any entity that has a serialized() method
 * input: entity: any - the entity to serialize
 * output: serialized: any - the serialized entity 
 * 
 * This serializedEntity function is used to serialize any entity before 
 * sending the response to the client. 
 */
export const serializeEntity = async (entity: any): Promise<any> => {
  return await executeEffect(entity.serialized());
};

