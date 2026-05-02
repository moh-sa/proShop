/** String literal kinds for `NormalizedError` */
export const ERROR_KIND = {
	NETWORK: "NETWORK",
	SERVER: "SERVER",
	RESPONSE_PARSE: "RESPONSE_PARSE",
	INPUT_VALIDATION: "INPUT_VALIDATION",
	UNKNOWN: "UNKNOWN",
} as const;

export type ErrorKind = (typeof ERROR_KIND)[keyof typeof ERROR_KIND];
