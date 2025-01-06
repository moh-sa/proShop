import jwt, { JwtPayload } from "jsonwebtoken";

type CustomJwtPayload = Required<Pick<JwtPayload, "iat" | "exp">>;
/**
 * @template T - accept any object type. Default value is `id: ObjectId`
 * @param {string} token - jwt token
 * @returns return `{T, iat, exp}` type
 */
export function verifyJwtToken<
  T extends Record<string, unknown> = { id: string },
>(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as T & CustomJwtPayload;
}
