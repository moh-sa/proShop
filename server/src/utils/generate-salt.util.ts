import bcrypt from "bcryptjs";

export async function generateSalt() {
  return bcrypt.genSalt(Number(process.env.SALT_ROUNDS!));
}
