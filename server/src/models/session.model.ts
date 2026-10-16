import { model, Schema } from "mongoose";

import { MAX_USER_AGENT_LENGTH } from "../constants/index.js";
import type { SessionSchema } from "../types/index.js";

const SessionSchema = new Schema<SessionSchema>(
	{
		expiresAt: {
			required: [true, "Expiration date is required"],
			type: Schema.Types.Date,
		},
		lastSeenAt: {
			required: [true, "Last seen date is required"],
			type: Schema.Types.Date,
		},
		tokenHash: {
			required: [true, "Token hash is required"],
			type: Schema.Types.String,
			unique: true,
		},
		userAgent: {
			default: "",
			maxlength: MAX_USER_AGENT_LENGTH,
			type: Schema.Types.String,
		},
		userId: {
			index: true,
			ref: "User",
			required: [true, "User reference is required"],
			type: Schema.Types.ObjectId,
		},
	},
	{
		timestamps: true,
	},
);

// MongoDB removes a session once `expiresAt` passes (checked about once a minute,
// so `SessionService.validate` also checks it)
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model<SessionSchema>("Session", SessionSchema);
