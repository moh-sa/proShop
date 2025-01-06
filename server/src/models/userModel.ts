import bcrypt from "bcryptjs";
import { model, Schema } from "mongoose";
import { TUserSchema } from "../types";
import { hashData } from "../utils";

const userSchema = new Schema<TUserSchema>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
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
  if (!this.isModified("password")) return next();

  try {
    this.password = await hashData(this.password);
    next();
  } catch (error) {
    return next(error as Error);
  }
});

const User = model<TUserSchema>("User", userSchema);

export default User;
