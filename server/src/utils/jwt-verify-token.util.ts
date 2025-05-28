import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";

type CustomJwtPayload = Required<Pick<JwtPayload, "iat" | "exp">>;
/**
 * @template T - accept any object type. Default value is `id: ObjectId`
 * @param {string} token - jwt token
 * @returns return `{T, iat, exp}` type
 */
export function verifyJwtToken<
  T extends Record<string, unknown> = { id: Types.ObjectId },
>(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as T & CustomJwtPayload;
}
