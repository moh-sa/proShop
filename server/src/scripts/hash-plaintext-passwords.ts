/**
 * One-off fix for passwords saved in plaintext by the old profile update
 * (before it hashed passwords). Users keep the password they chose.
 *
 * Report only (default):
 *   dev:  pnpm tsx src/scripts/hash-plaintext-passwords.ts
 *   prod: node dist/scripts/hash-plaintext-passwords.js
 * Hash in place: add `--fix`.
 *
 * Prints user ids and emails only - never passwords.
 */
import { pathToFileURL } from "node:url";

import mongoose from "mongoose";

import connectDB from "../config/db.js";
import { UserModel } from "../models/user.model.js";
import { passwordService } from "../services/index.js";

// every argon2 hash is a PHC string such as `$argon2id$v=19$...`
const NOT_ARGON2_HASH = { password: { $not: /^\$argon2/ } };

type PlaintextPasswordUser = { email: string; id: string };

type HashReport = {
	hashed: Array<string>;
	skipped: Array<string>;
};

export async function findUsersWithPlaintextPasswords(): Promise<
	Array<PlaintextPasswordUser>
> {
	const users = await UserModel.find(NOT_ARGON2_HASH, { email: 1 }).lean();

	return users.map((user) => ({ email: user.email, id: user._id.toString() }));
}

export async function hashPlaintextPasswords(): Promise<HashReport> {
	const report: HashReport = { hashed: [], skipped: [] };
	const users = await UserModel.find(NOT_ARGON2_HASH, { password: 1 }).lean();

	for (const user of users) {
		const userId = user._id.toString();

		const hashResult = await passwordService.hash({ password: user.password });
		if (!hashResult.success) {
			report.skipped.push(userId);
			continue;
		}

		// only replace the exact value we read, so a concurrent change is never overwritten
		const updateResult = await UserModel.updateOne(
			{ _id: user._id, password: user.password },
			{ $set: { password: hashResult.data } },
		);
		if (updateResult.modifiedCount === 1) {
			report.hashed.push(userId);
		} else {
			report.skipped.push(userId);
		}
	}

	return report;
}

async function main(): Promise<void> {
	const shouldFix = process.argv.includes("--fix");

	await connectDB();
	try {
		const users = await findUsersWithPlaintextPasswords();
		console.info(`Users with a plaintext password: ${users.length}`);
		console.table(users);

		if (!shouldFix || users.length === 0) {
			return;
		}

		const report = await hashPlaintextPasswords();
		console.info(`Hashed: ${report.hashed.length}`);
		if (report.skipped.length > 0) {
			// stored value breaks the password rules or changed mid-run; handle manually
			console.warn(`Skipped: ${report.skipped.join(", ")}`);
		}
	} finally {
		await mongoose.connection.close();
	}
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	main().catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
}
