import { z } from "zod";

import {
  emailValidator,
  jwtTokenValidator,
  objectIdValidator,
  passwordValidator,
} from "../../validators/index.js";

const baseUserSchema = z.object({
  email: emailValidator,
  isAdmin: z.boolean().default(false),
  name: z.string().trim().min(1, { message: "Name is required" }),
  password: passwordValidator,
});

export const insertUserSchema = baseUserSchema;
export const selectUserSchema = baseUserSchema.extend({
  _id: objectIdValidator,
  createdAt: z.date(),
  token: jwtTokenValidator.optional(),
  updatedAt: z.date(),
});
