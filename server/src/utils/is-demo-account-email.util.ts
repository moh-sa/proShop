import { DEMO_ACCOUNT_EMAIL_SET } from "../constants/demo-account.constants.js";

export function isDemoAccountEmail(email: string): boolean {
	return DEMO_ACCOUNT_EMAIL_SET.has(email.toLowerCase());
}
