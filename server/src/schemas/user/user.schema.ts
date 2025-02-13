import { Types } from "mongoose";
import { z } from "zod";
import {
  emailValidator,
  jwtValidator,
  passwordValidator,
} from "../../validators";

const baseUserSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
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
