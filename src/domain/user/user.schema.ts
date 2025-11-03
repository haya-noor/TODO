import { Schema as S } from "effect";

import { UserIdSchema } from "../brand/ids";
import { DateTimeSchema } from "../brand/schemas";
import { UserGuards } from "./user.guards";


 
export const UserSchema = S.Struct({
  id: UserIdSchema,
  name: S.String.pipe(UserGuards.validateName),
  email: S.String.pipe(UserGuards.validateEmail),
  password: S.String.pipe(UserGuards.validatePassword),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema
})

export type User = S.Schema.Type<typeof UserSchema>
export type SerializedUser = S.Schema.Encoded<typeof UserSchema>


