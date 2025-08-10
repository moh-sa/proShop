import type { Types } from "mongoose";

import type { SelectReview } from "./review.type.js";
import type { SelectUser } from "./user.type.js";

declare global {
	namespace Express {
		interface Locals {
			review: SelectReview;
			token: {
				_id: Types.ObjectId;
				exp: number;
				iat: number;
			};
			user: SelectUser;
		}
	}
}
