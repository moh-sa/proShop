import bcrypt from "bcryptjs";
import { model, Schema } from "mongoose";

import type { UserSchema } from "../types/index.js";

import { hashData } from "../utils/index.js";

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
	return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}

	try {
		this.password = await hashData(this.password);
		next();
	} catch (error) {
		return next(error as Error);
	}
});

const User = model<UserSchema>("User", userSchema);

export default User;
