import {Effect as E, Option as O, ParseResult, Schema as S} from "effect";

/**
 * Factory function to create a not-empty validation filter for any property
 */
export const createNotEmptyFilter = (propertyName: string) =>
    S.filter(
        (input: string): input is string => {
            return input.trim().length > 0;
        },
        {
            message: () => `${propertyName} cannot be empty`
        }
    );

/**
 * Fixed version of OptionFromNullishOr that properly handles encoding
 * without passing null/undefined through Union transformers.
 *
 * This implementation completely avoids Union schemas and handles
 * null/undefined values directly in the transform functions, preventing
 * null values from reaching the underlying value schema transformers.
 */
export const OptionFromNullishOrFixed = <Value extends S.Schema.AnyNoContext>(
    value: Value,
    onNoneEncoding: null | undefined
) => {
    return S.transformOrFail(
        S.Unknown, // Accept any input, we'll validate in decode
        S.OptionFromSelf(S.typeSchema(S.asSchema(value))),
        {
            strict: true,
            decode: (input, _, ast) => {
                // Handle null/undefined directly without delegating to Union
                if (input === null || input === undefined) {
                    return ParseResult.succeed(O.none());
                }

                // For non-null values, decode through the original schema
                try {
                    const result = S.decodeUnknownSync(value)(input);

                    return ParseResult.succeed(O.some(result));
                } catch (error) {
                    return ParseResult.fail(new ParseResult.Type(ast, input, `Decode failed: ${error}`));
                }
            },
            encode: (option, _, ast) => {
                // Handle Option.none() directly without any schema processing
                if (O.isNone(option)) {
                    return ParseResult.succeed(onNoneEncoding);
                }

                // For Option.some(), encode the inner value through the original schema
                try {
                    const result = S.encodeSync(value)(option.value);

                    return ParseResult.succeed(result);
                } catch (error) {
                    return ParseResult.fail(new ParseResult.Type(ast, option, `Encode failed: ${error}`));
                }
            }
        }
    );
};

/**
 * Factory function to create an optional field from nullish values
 * Uses the fixed OptionFromNullishOr implementation to avoid encoding issues
 */
export const Optional = <A, I, R>(schema: S.Schema<A, I, never>) => OptionFromNullishOrFixed(schema, null);
