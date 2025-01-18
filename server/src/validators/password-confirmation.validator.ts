import { z } from "zod";
import { isPasswordValid } from "../utils";
import { passwordValidator } from "./password.validator";

export const passwordConfirmationValidator = z
  .object({
    request: passwordValidator,
    encrypted: passwordValidator,
  })
  .refine(async (data) => await isPasswordValid(data.request, data.encrypted), {
    message: "Invalid email or password.",
  });
