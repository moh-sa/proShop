import { Types } from "mongoose";
import { z } from "zod";
import { emailValidator, jwtValidator, passwordValidator } from "../validators";

const baseUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: emailValidator,
  password: passwordValidator,
  isAdmin: z.boolean().default(false),
});

export const insertUserSchema = baseUserSchema;

export const selectUserSchema = baseUserSchema.extend({
  _id: z.instanceof(Types.ObjectId, { message: "Invalid ObjectId format." }),
  createdAt: z.date(),
  updatedAt: z.date(),
  token: jwtValidator.optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UserSchema = SelectUser & {
  matchPassword: (enteredPassword: string) => Promise<boolean>;
};
