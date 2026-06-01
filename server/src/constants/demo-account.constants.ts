export const DEMO_ACCOUNT_EMAILS = {
	admin: "admin@example.com",
	customer: "customer@example.com",
} as const;

export const DEMO_ACCOUNT_EMAIL_SET = new Set<string>(
	Object.values(DEMO_ACCOUNT_EMAILS),
);
