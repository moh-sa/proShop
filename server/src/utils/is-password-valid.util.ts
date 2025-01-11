import { compare } from "bcryptjs";

export async function isPasswordValid(
  enteredPassword: string,
  userPassword: string,
) {
  return await compare(enteredPassword, userPassword);
}
