import jwt from "jsonwebtoken";
import { z, ZodSchema } from "zod";
import { env } from "../config/env";
import {
  InvalidJwtTokenError,
  InvalidJwtTokenPayloadError,
  JwtTokenExpiredError,
  JwtVerificationError,
} from "../errors";
import { jwtTokenValidator } from "../validators";

const standardJwtPayloadSchema = z.object({
  iat: z.number(),
  exp: z.number(),
});

type StandardJwtPayload = z.infer<typeof standardJwtPayloadSchema>;
type DecodedJwtToken<S extends ZodSchema> = z.infer<S> & StandardJwtPayload;

// 'function overloading' is used to ensure the correct return type
// based on the provided payload schema
export function verifyJwtToken(token: string): StandardJwtPayload;
export function verifyJwtToken<S extends ZodSchema>(
  token: string,
  customPayloadSchema: S,
): DecodedJwtToken<S>;
export function verifyJwtToken<S extends ZodSchema>(
  token: string,
  customPayloadSchema?: S,
): StandardJwtPayload | DecodedJwtToken<S> {
  // step 1: validate token format
  const tokenResult = validateTokenFormat(token);

  // step 2: decode and verify JWT
  const decodedToken = decodeJwtToken(tokenResult);

  // step 3: validate payload
  const validatedPayload = validatePayload(decodedToken, customPayloadSchema);

  return validatedPayload;
}

function validateTokenFormat(token: string): string {
  const tokenParsed = jwtTokenValidator.safeParse(token);
  if (!tokenParsed.success) {
    throw new InvalidJwtTokenError(tokenParsed.error.format());
  }

  return tokenParsed.data;
}

function decodeJwtToken(token: string): jwt.JwtPayload | undefined {
  try {
    const decodedToken = jwt.verify(token, env.JWT_SECRET);
    if (!(decodedToken instanceof Object)) {
      throw new jwt.JsonWebTokenError("Invalid JWT token");
    }

    return decodedToken;
  } catch (error) {
    mapJwtLibraryError(error);
  }
}

function validateStandardPayload(payload: unknown): StandardJwtPayload {
  const payloadParsed = standardJwtPayloadSchema.safeParse(payload);
  if (!payloadParsed.success) {
    throw new InvalidJwtTokenPayloadError(payloadParsed.error.format());
  }

  return payloadParsed.data;
}

function validateCustomPayload<S extends ZodSchema>(
  payload: unknown,
  customSchema: S,
): DecodedJwtToken<S> {
  const payloadParsed = standardJwtPayloadSchema
    .and(customSchema)
    .safeParse(payload);
  if (!payloadParsed.success) {
    throw new InvalidJwtTokenPayloadError(payloadParsed.error.format());
  }

  return payloadParsed.data;
}

function validatePayload<S extends ZodSchema>(
  payload: unknown,
  customSchema?: S,
): StandardJwtPayload | DecodedJwtToken<S> {
  if (!customSchema) {
    return validateStandardPayload(payload);
  }

  return validateCustomPayload(payload, customSchema);
}

function mapJwtLibraryError(error: unknown) {
  if (error instanceof jwt.TokenExpiredError) {
    throw new JwtTokenExpiredError();
  }

  if (error instanceof jwt.JsonWebTokenError) {
    throw new InvalidJwtTokenError();
  }

  throw new JwtVerificationError();
}
