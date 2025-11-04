

import { Schema as S, Effect, ParseResult } from "effect"

export const serializeWith =  < A, I > (
    schema: S.Schema<A, I, never>,
    entity: A
): Effect.Effect<I, ParseResult.ParseError, never> => {
    return S.encode(schema)(entity)
}