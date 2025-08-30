import { model, Schema } from "mongoose";

import type { UserSchema } from "../types/index.js";

import {
	MAX_NAME_LENGTH,
	MIN_NAME_LENGTH,
} from "../constants/user-name.constants.js";
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
			required: true,
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

userSchema.methods.matchPassword = async function (enteredPassword: string) {
	const pswService = new PasswordService();
	return await pswService.verify({
		hashedPassword: this.password,
		password: enteredPassword,
	});
};

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	const pswService = new PasswordService();
	try {
		this.password = await pswService.hash({ password: this.password });
		next();
	} catch (error) {
		return next(error as Error);
	}
});

const User = model<UserSchema>("User", userSchema);

export default User;
