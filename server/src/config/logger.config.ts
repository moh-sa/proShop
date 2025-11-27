import pino from "pino";

import { env } from "./env.js";

const isProd = env.NODE_ENV === "production";
const isDev = env.NODE_ENV === "development";

export const loggerConfig: pino.LoggerOptions = {
	base: {
		env: env.NODE_ENV,
	},
	formatters: {
		level: (label) => ({ level: label.toUpperCase() }),
	},
	level: isProd ? "info" : isDev ? "debug" : "silent",
	redact: ["req.headers.cookie", "**.email", "**.password"],
	serializers: {
		error: pino.stdSerializers.err,
	},
	timestamp: pino.stdTimeFunctions.isoTimeNano,
};
