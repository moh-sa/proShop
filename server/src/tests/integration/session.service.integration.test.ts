import assert from "node:assert";
import { createHash } from "node:crypto";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import {
	MAX_USER_AGENT_LENGTH,
	SESSION_ABSOLUTE_TIMEOUT_MS,
	SESSION_IDLE_TIMEOUT_MS,
} from "../../constants/index.js";
import { AuthenticationError } from "../../errors/index.js";
import { SessionModel } from "../../models/session.model.js";
import { SessionService } from "../../services/index.js";
import { generateMockObjectId } from "../mocks/index.js";
import { connectTestDatabase, disconnectTestDatabase } from "../utils/index.js";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

function sha256(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

// writes through the driver, so mongoose can't overwrite `createdAt`
async function setSessionTimes(
	sessionId: string,
	times: { createdAt?: Date; lastSeenAt?: Date },
) {
	await SessionModel.collection.updateOne(
		{ _id: new SessionModel.base.Types.ObjectId(sessionId) },
		{ $set: times },
	);
}

suite("Session Service 〖 Integration Tests 〗", () => {
	const service = new SessionService();
	const userId = generateMockObjectId();

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => await SessionModel.deleteMany({}));

	async function createSession(userAgent = "test-agent") {
		const result = await service.create({ userAgent, userId });
		assert.ok(result.success);
		return result.data;
	}

	describe("create", () => {
		test("Should store only the SHA-256 hash of the token", async () => {
			const { session, token } = await createSession();

			const stored = await SessionModel.findById(session.id).lean();
			assert.ok(stored);
			assert.strictEqual(stored.tokenHash, sha256(token));
			assert.notStrictEqual(stored.tokenHash, token);
		});

		test("Should return a 256-bit base64url token", async () => {
			const { token } = await createSession();

			assert.match(token, /^[A-Za-z0-9_-]{43}$/);
		});

		test("Should cap the stored user agent length", async () => {
			const { session } = await createSession("x".repeat(2000));

			assert.strictEqual(session.userAgent.length, MAX_USER_AGENT_LENGTH);
		});
	});

	describe("validate", () => {
		test("Should return the session for a valid token", async () => {
			const { session, token } = await createSession();

			const result = await service.validate({ token });

			assert.ok(result.success);
			assert.strictEqual(result.data.id, session.id);
		});

		for (const token of ["", "unknown-token"]) {
			test(`Should return 'AuthenticationError' for token ${JSON.stringify(token)}`, async () => {
				await createSession();

				const result = await service.validate({ token });

				assert.strictEqual(result.success, false);
				assert.ok(result.error instanceof AuthenticationError);
			});
		}

		test("Should reject and delete a session idle for longer than the idle timeout", async () => {
			const { session, token } = await createSession();
			await setSessionTimes(session.id, {
				lastSeenAt: new Date(Date.now() - SESSION_IDLE_TIMEOUT_MS - MINUTE_MS),
			});

			const result = await service.validate({ token });

			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof AuthenticationError);
			assert.strictEqual(await SessionModel.countDocuments(), 0);
		});

		test("Should reject an active session older than the absolute timeout", async () => {
			const { session, token } = await createSession();
			await setSessionTimes(session.id, {
				createdAt: new Date(
					Date.now() - SESSION_ABSOLUTE_TIMEOUT_MS - MINUTE_MS,
				),
				lastSeenAt: new Date(),
			});

			const result = await service.validate({ token });

			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof AuthenticationError);
		});

		test("Should not write when the session was seen within the last hour", async () => {
			const { session, token } = await createSession();
			const lastSeenAt = new Date(Date.now() - 10 * MINUTE_MS);
			await setSessionTimes(session.id, { lastSeenAt });

			await service.validate({ token });

			const stored = await SessionModel.findById(session.id).lean();
			assert.strictEqual(stored?.lastSeenAt.getTime(), lastSeenAt.getTime());
		});

		test("Should slide 'lastSeenAt' and 'expiresAt' when last seen over an hour ago", async () => {
			const { session, token } = await createSession();
			await setSessionTimes(session.id, {
				lastSeenAt: new Date(Date.now() - 2 * HOUR_MS),
			});
			const startedAt = Date.now();

			await service.validate({ token });

			const stored = await SessionModel.findById(session.id).lean();
			assert.ok(stored);
			assert.ok(stored.lastSeenAt.getTime() >= startedAt);
			assert.ok(
				stored.expiresAt.getTime() >= startedAt + SESSION_IDLE_TIMEOUT_MS,
			);
		});

		test("Should never slide 'expiresAt' past the absolute timeout", async () => {
			const { session, token } = await createSession();
			const createdAt = new Date(
				Date.now() - SESSION_ABSOLUTE_TIMEOUT_MS + HOUR_MS * 24,
			);
			await setSessionTimes(session.id, {
				createdAt,
				lastSeenAt: new Date(Date.now() - 2 * HOUR_MS),
			});

			await service.validate({ token });

			const stored = await SessionModel.findById(session.id).lean();
			assert.strictEqual(
				stored?.expiresAt.getTime(),
				createdAt.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS,
			);
		});
	});

	describe("deleteAllByUserIdExcept", () => {
		test("Should delete every session of the user except the given one", async () => {
			const { session: kept } = await createSession();
			await createSession();
			await createSession();

			const result = await service.deleteAllByUserIdExcept({
				exceptSessionId: kept.id,
				userId,
			});

			assert.ok(result.success);
			assert.strictEqual(result.data, 2);
			const remaining = await SessionModel.find().lean();
			assert.deepStrictEqual(
				remaining.map((session) => session._id.toString()),
				[kept.id],
			);
		});
	});
});
