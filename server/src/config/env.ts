import { config } from "dotenv";
import { z } from "zod";

import { InternalError } from "../errors/index.js";

const EnvSchema = z.object({
	// the single public origin, e.g. https://proshop.moh-sa.dev
	APP_URL: z.url(),
	CLOUDINARY_API_KEY: z.string().min(1),
	CLOUDINARY_API_SECRET: z.string().min(1),
	CLOUDINARY_CLOUD_NAME: z.string().min(1),
	DB_URL: z.string().min(1),
	NODE_ENV: z.enum(["development", "test", "production"]),
	PAYPAL_CLIENT_ID: z.string().min(1),
	PORT: z.coerce.number().min(1),
	SENTRY_DNS: z.url(),
	STRIPE_SECRET: z.string().min(1),
	STRIPE_WEBHOOK_SECRET: z.string().min(1),
});

config();

const envParsed = EnvSchema.safeParse(process.env);

if (!envParsed.success) {
	const errorMessage = [
		"❌ Environment validation failed:",
		envParsed.error.issues
			.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
			.join("\n"),
		"\nPlease check your .env file and ensure all required variables are set correctly.",
	].join("\n");

	throw new InternalError(errorMessage, { cause: envParsed.error });
}

export const env = envParsed.data;
