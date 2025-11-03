import { Schema as S } from "effect";


export class UserGuards {
    static validateName = S.filter(
        (input: string): input is string => {
            return input.length > 0 && input.length < 255;
        },
        {
            message: () => "Name must be between 1 and 255 characters"
        }
    );
    static validateEmail = S.filter(
        (input: string): input is string => {
            return input.length > 0 && input.length < 255;
        },
        {
            message: () => "Email must be between 1 and 255 characters"
        }
    );
    static validatePassword = S.filter(
        (input: string): input is string => {
            return input.length > 0 && input.length < 255;
        },
        {
            message: () => "Password must be between 1 and 255 characters"
        }
    );
}