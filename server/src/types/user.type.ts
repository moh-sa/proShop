import { Types } from "mongoose";
import { z } from "zod";

const baseUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Invalid email format." }),
  password: z.string().min(6, { message: "Password is required." }),
  isAdmin: z.boolean().default(false),
});

export const insertUserSchema = baseUserSchema;

export const selectUserSchema = baseUserSchema.extend({
  _id: z.instanceof(Types.ObjectId, { message: "Invalid ObjectId format." }),
  createdAt: z.date(),
  updatedAt: z.date(),
  token: z
    .string()
    .min(1, { message: "Token is required." })
    .jwt({ message: "Invalid jwt token format." })
    .optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UserSchema = SelectUser & {
  matchPassword: (enteredPassword: string) => Promise<boolean>;
};
