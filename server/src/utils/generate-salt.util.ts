import bcrypt from "bcryptjs";
import { env } from "../config/env";

export async function generateSalt() {
  return bcrypt.genSalt(Number(env.SALT_ROUNDS));
}
