import { model, Schema } from "mongoose";

import type { UserSchema } from "../types/index.js";

import {
	MAX_NAME_LENGTH,
	MAX_PASSWORD_LENGTH,
	MIN_NAME_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "../constants/index.js";
import { PasswordService } from "../services/index.js";

const userSchema = new Schema<UserSchema>(
	{
		email: {
			lowercase: true,
			required: true,
			trim: true,
			type: String,
			unique: true,
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

// TODO: remove after implementing auth v2
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	const pswService = new PasswordService();
	try {
		const passwordHashingResult = await pswService.hash({
			password: this.password,
		});
		if (!passwordHashingResult.success) {
			return next(passwordHashingResult.error);
		}
		this.password = passwordHashingResult.data;
		next();
	} catch (error) {
		return next(error as Error);
	}
});

const User = model<UserSchema>("User", userSchema);

export default User;
