import { model, Schema } from "mongoose";

import {
	MAX_NAME_LENGTH,
	MAX_PASSWORD_LENGTH,
	MIN_NAME_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "../constants/index.js";
import type { UserSchema } from "../types/index.js";
import { emailValidator } from "../validators/email.validator.js";

const userSchema = new Schema<UserSchema>(
	{
		email: {
			lowercase: true,
			required: true,
			trim: true,
			type: String,
			unique: true,
			validate: {
				message: "Invalid email format",
				validator(value: string) {
					return emailValidator.safeParse(value).success;
				},
			},
		},
		isAdmin: {
			default: false,
			required: true,
			type: Boolean,
		},
		name: {
			maxlength: [
				MAX_NAME_LENGTH,
				`Name cannot exceed ${MAX_NAME_LENGTH} characters`,
			],
			minlength: [
				MIN_NAME_LENGTH,
				`Name must be at least ${MIN_NAME_LENGTH} characters long`,
			],
			required: true,
			trim: true,
			type: String,
		},
		password: {
			maxlength: [
				MAX_PASSWORD_LENGTH,
				`Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`,
			],
			minlength: [
				MIN_PASSWORD_LENGTH,
				`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
			],
			required: true,
			trim: true,
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

export const UserModel = model<UserSchema>("User", userSchema);
