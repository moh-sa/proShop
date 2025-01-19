import { z } from "zod";
import { insertUserSchema, selectUserSchema } from "../schemas";

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UserSchema = SelectUser & {
  matchPassword: (enteredPassword: string) => Promise<boolean>;
};
