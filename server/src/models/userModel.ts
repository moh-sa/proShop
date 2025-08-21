import { model, Schema } from "mongoose";

import type { UserSchema } from "../types/index.js";

import { PasswordService } from "../services/index.js";

const userSchema = new Schema<UserSchema>(
	{
		email: {
			required: true,
			type: String,
			unique: true,
		},
		isAdmin: {
			default: false,
			required: true,
			type: Boolean,
		},
		name: {
			required: true,
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
