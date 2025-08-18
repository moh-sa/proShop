import { model, Schema } from "mongoose";

import { SessionSchema } from "../types/index.js";
import { jwtTokenValidator } from "../validators/index.js";

const SessionSchema = new Schema<SessionSchema>(
	{
		expiresAt: {
			required: [true, "Expiration date is required"],
			type: Schema.Types.Date,
			validate: {
				message: "Expiration date must be in the future",
				validator(value: Date) {
					return value.getTime() > Date.now();
				},
			},
		},
		revokedAt: {
			default: null,
			index: true,
			type: Schema.Types.Date,
			validate: {
				message:
					"Revoked date must be equals to the current date or in the past",
				validator(value: Date | null) {
					if (!value) {
						return true;
					}
					return value.getTime() <= Date.now();
				},
			},
		},
		tokenId: {
			index: true,
			required: [true, "Token ID is required"],
			type: Schema.Types.String,
			unique: true,
			validate: {
				message: "Invalid token ID",
				validator(value: string) {
					return jwtTokenValidator.safeParse(value).success;
				},
			},
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

// Indexes
SessionSchema.index({ tokenId: 1, userId: 1 }, { unique: true });

export const Session = model<SessionSchema>("Session", SessionSchema);
