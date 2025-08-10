import bcrypt from "bcryptjs";

import { env } from "../config/env.js";

export async function generateSalt() {
	return bcrypt.genSalt(Number(env.SALT_ROUNDS));
}
