import { z } from "zod";

/**
 * remove `VITE_` prefix from keys
 */
function prepareEnv(data: Record<string, string>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(data).map(([key, value]) => [
			key.replace("VITE_", ""),
			value,
		]),
	);
}

const envSchema = z.object({
	// vite-specific vars
	MODE: z.enum(["development", "production"]),
	DEV: z.boolean(),
	PROD: z.boolean(),

	// custom vars
	API_URL: z.url(),
	SENTRY_DSN: z.url().includes("sentry.io"),
	SENTRY_AUTH_TOKEN: z.string().startsWith("sntrys_"),
});

const schemaResult = z
	.preprocess((value) => prepareEnv(value as Record<string, string>), envSchema)
	.safeParse(import.meta.env);

if (!schemaResult.success) {
	const error = schemaResult.error;
	let message = "❌ Missing required values in .env:\n";
	error.issues.forEach((issue) => {
		message += issue.path.join(".") + ": " + issue.message + "\n";
	});
	const e = new Error(message);
	e.stack = "";
	throw e;
}

export const env = schemaResult.data;
