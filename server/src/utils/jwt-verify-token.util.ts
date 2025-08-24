import type { ZodSchema } from "zod";

import jwt from "jsonwebtoken";
import { z } from "zod";

import { env } from "../config/index.js";
import {
	InvalidJwtTokenError,
	InvalidJwtTokenPayloadError,
	JwtTokenExpiredError,
	JwtVerificationError,
} from "../errors/index.js";
import { jwtTokenValidator } from "../validators/index.js";

const standardJwtPayloadSchema = z.object({
	exp: z.number(),
	iat: z.number(),
});

type DecodedJwtToken<S extends ZodSchema> = StandardJwtPayload & z.infer<S>;
type StandardJwtPayload = z.infer<typeof standardJwtPayloadSchema>;

// 'function overloading' is used to ensure the correct return type
// based on the provided payload schema
/** @deprecated // TODO: remove */
export function verifyJwtToken(token: string): StandardJwtPayload;
export function verifyJwtToken<S extends ZodSchema>(
	token: string,
	customPayloadSchema: S,
): DecodedJwtToken<S>;
export function verifyJwtToken<S extends ZodSchema>(
	token: string,
	customPayloadSchema?: S,
): DecodedJwtToken<S> | StandardJwtPayload {
	// step 1: validate token format
	const tokenResult = validateTokenFormat(token);

	// step 2: decode and verify JWT
	const decodedToken = decodeJwtToken(tokenResult);

	// step 3: validate payload
	const validatedPayload = validatePayload(decodedToken, customPayloadSchema);

	return validatedPayload;
}

/** @deprecated // TODO: remove */
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

/** @deprecated // TODO: remove */
function mapJwtLibraryError(error: unknown) {
	if (error instanceof jwt.TokenExpiredError) {
		throw new JwtTokenExpiredError();
	}

	if (error instanceof jwt.JsonWebTokenError) {
		throw new InvalidJwtTokenError();
	}

	throw new JwtVerificationError();
}

/** @deprecated // TODO: remove */
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

/** @deprecated // TODO: remove */
function validatePayload<S extends ZodSchema>(
	payload: unknown,
	customSchema?: S,
): DecodedJwtToken<S> | StandardJwtPayload {
	if (!customSchema) {
		return validateStandardPayload(payload);
	}

	return validateCustomPayload(payload, customSchema);
}

/** @deprecated // TODO: remove */
function validateStandardPayload(payload: unknown): StandardJwtPayload {
	const payloadParsed = standardJwtPayloadSchema.safeParse(payload);
	if (!payloadParsed.success) {
		throw new InvalidJwtTokenPayloadError(payloadParsed.error.format());
	}

	return payloadParsed.data;
}

/** @deprecated // TODO: remove */
function validateTokenFormat(token: string): string {
	const tokenParsed = jwtTokenValidator.safeParse(token);
	if (!tokenParsed.success) {
		throw new InvalidJwtTokenError(tokenParsed.error.format());
	}

	return tokenParsed.data;
}
