import type { User } from "@/features/users";
import type z from "zod";
import type { signInInputSchema, signUpInputSchema } from "../schemas";

export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type SignUpOutput = User;

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignInOutput = User;
