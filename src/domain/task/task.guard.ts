import { Schema as S } from "effect";
import { TaskSchema } from "./task.schema";


export class TaskGuards {
    static validateTitle = S.filter(
        (input: string): input is string => {
            return input.length > 0 && input.length <= 255;
        },
        {
            message: () => "Title must be between 1 and 255 characters"
        }
    );

  static validateDescription = S.filter(
    (input: string): input is string => {
      return input.length >= 50 && input.length <= 1000;
    },
    {
      message: () => "Description must be between 50 and 1000 characters"
    }
  );
  
}