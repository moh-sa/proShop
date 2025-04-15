import { config } from "dotenv";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().min(1),
  DB_URL: z.string().min(1),
  SENTRY_DNS: z.string().min(1).url(),
  JWT_SECRET: z.string().min(1),
  SALT_ROUNDS: z.coerce.number().min(1),
  PAYPAL_CLIENT_ID: z.string().min(1),
  CLIENT_URL: z.string().url(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
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

  throw new Error(errorMessage);
}

export const env = envParsed.data;
