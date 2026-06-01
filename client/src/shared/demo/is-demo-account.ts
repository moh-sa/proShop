import { DEMO_ACCOUNT_EMAIL_SET } from "./demo-accounts";

export function isDemoAccountEmail(email: string): boolean {
	return DEMO_ACCOUNT_EMAIL_SET.has(email.toLowerCase());
}
