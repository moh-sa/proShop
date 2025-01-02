import bcrypt from "bcryptjs";
import { generateSalt } from "./generate-salt.util";

export async function hashData(data: string, salt?: string) {
  const fallbackSalt = salt ?? (await generateSalt());
  return await bcrypt.hash(data, fallbackSalt);
}
