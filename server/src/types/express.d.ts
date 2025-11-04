import type { SafeSelectUser } from "./user.type.js";

declare global {
	namespace Express {
		interface Locals {
			user?: SafeSelectUser;
			userId?: string;
		}
		interface Request {
			id: string;
		}
	}
}
