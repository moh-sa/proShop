import type { Session } from "./session.type.js";
import type { SafeSelectUser } from "./user.type.js";

declare global {
	namespace Express {
		interface Locals {
			session?: Session;
			user?: SafeSelectUser;
		}
		interface Request {
			id: string;
		}
	}
}
