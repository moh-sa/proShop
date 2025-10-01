import type { z } from "zod";

import type {
	jwtConfigSchema,
	tokenDecodedSchema,
	tokenPairSchema,
	tokenPayloadSchema,
	tokenResultSchema,
} from "../schemas/index.js";

export enum TokenType {
	ACCESS = "access",
	REFRESH = "refresh",
}

export type JwtConfig = z.infer<typeof jwtConfigSchema>;

export type TokenDecoded = z.infer<typeof tokenDecodedSchema>;

export type TokenPair = z.infer<typeof tokenPairSchema>;

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

export type TokenResult = z.infer<typeof tokenResultSchema>;
