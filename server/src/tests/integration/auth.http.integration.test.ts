import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import request from "supertest";

import app from "../../app.js";
import {
	DEMO_ACCOUNT_EMAILS,
	SESSION_COOKIE_NAME,
} from "../../constants/index.js";
import { SessionModel } from "../../models/session.model.js";
import { UserModel } from "../../models/user.model.js";
import { passwordService } from "../../services/index.js";
import { generateMockInsertUser } from "../mocks/index.js";
import { connectTestDatabase, disconnectTestDatabase } from "../utils/index.js";

const PASSWORD = "Password123!";
const USER_AGENT = "Mozilla/5.0 (Macintosh) TestBrowser/1.0";

// each test gets its own client IP, so rate limits never leak between tests
let ipCounter = 0;
function nextClientIp(): string {
	ipCounter += 1;
	return `198.51.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

function getSessionSetCookie(res: request.Response): string | undefined {
	const setCookie = res.headers["set-cookie"] as unknown as
		| Array<string>
		| undefined;
	return setCookie?.find((cookie) =>
		cookie.startsWith(`${SESSION_COOKIE_NAME}=`),
	);
}

// the `name=value` part, ready for a `Cookie` request header
function toCookieHeader(setCookie: string | undefined): string {
	assert.ok(setCookie, "expected a session Set-Cookie header");
	return setCookie.split(";")[0];
}

suite("Auth over HTTP 〖 Integration Tests 〗", () => {
	let clientIp: string;

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => {
		clientIp = nextClientIp();
		await SessionModel.deleteMany({});
		await UserModel.deleteMany({});
	});

	function api() {
		return {
			delete: (path: string) =>
				request(app)
					.delete(`/api/v1${path}`)
					.set("X-Forwarded-For", clientIp)
					.set("User-Agent", USER_AGENT),
			get: (path: string) =>
				request(app)
					.get(`/api/v1${path}`)
					.set("X-Forwarded-For", clientIp)
					.set("User-Agent", USER_AGENT),
			patch: (path: string) =>
				request(app)
					.patch(`/api/v1${path}`)
					.set("X-Forwarded-For", clientIp)
					.set("User-Agent", USER_AGENT),
			post: (path: string) =>
				request(app)
					.post(`/api/v1${path}`)
					.set("X-Forwarded-For", clientIp)
					.set("User-Agent", USER_AGENT),
		};
	}

	// inserts a user with a real hash, for accounts sign-up can't create
	async function insertUser(options: { email?: string; isAdmin: boolean }) {
		const hashResult = await passwordService.hash({ password: PASSWORD });
		assert.ok(hashResult.success);
		const user = await UserModel.create(
			generateMockInsertUser({ ...options, password: hashResult.data }),
		);
		return { email: user.email, id: user._id.toString() };
	}

	async function getUserId(email: string): Promise<string> {
		const user = await UserModel.findOne({ email }).lean();
		assert.ok(user);
		return user._id.toString();
	}

	async function signUp() {
		const user = generateMockInsertUser({ password: PASSWORD });
		const res = await api()
			.post("/auth/signup")
			.send({ email: user.email, name: user.name, password: PASSWORD });
		assert.strictEqual(res.status, 201);
		return { cookie: toCookieHeader(getSessionSetCookie(res)), user };
	}

	async function signIn(email: string, cookie?: string) {
		const req = api().post("/auth/signin").send({ email, password: PASSWORD });
		const res = await (cookie ? req.set("Cookie", cookie) : req);
		assert.strictEqual(res.status, 200);
		return toCookieHeader(getSessionSetCookie(res));
	}

	describe("session cookie", () => {
		test("Should set a __Host- cookie that is HttpOnly, Secure, SameSite=Strict and host-only", async () => {
			const user = generateMockInsertUser({ password: PASSWORD });

			const res = await api()
				.post("/auth/signup")
				.send({ email: user.email, name: user.name, password: PASSWORD });

			const setCookie = getSessionSetCookie(res);
			assert.ok(setCookie);
			const attributes = setCookie.split(";").map((part) => part.trim());
			assert.ok(attributes.includes("Path=/"));
			assert.ok(attributes.includes("HttpOnly"));
			assert.ok(attributes.includes("Secure"));
			assert.ok(attributes.includes("SameSite=Strict"));
			assert.ok(attributes.some((part) => part.startsWith("Expires=")));
			assert.ok(!attributes.some((part) => part.startsWith("Domain=")));
		});

		test("Should never store the cookie token in the database", async () => {
			const { cookie } = await signUp();
			const token = decodeURIComponent(cookie.split("=")[1]);

			const sessions = await SessionModel.find().lean();
			assert.strictEqual(sessions.length, 1);
			assert.ok(!JSON.stringify(sessions).includes(JSON.parse(token)));
		});
	});

	describe("authentication", () => {
		test("Should return the profile with a valid session cookie", async () => {
			const { cookie, user } = await signUp();

			const res = await api().get("/users/profile").set("Cookie", cookie);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.data.email, user.email);
		});

		test("Should return 401 without a session cookie", async () => {
			const res = await api().get("/users/profile");

			assert.strictEqual(res.status, 401);
		});

		test("Should return 401 and clear the cookie for an unknown token", async () => {
			const res = await api()
				.get("/users/profile")
				.set("Cookie", `${SESSION_COOKIE_NAME}=%22forged-token%22`);

			assert.strictEqual(res.status, 401);
			assert.match(getSessionSetCookie(res) ?? "", /Expires=Thu, 01 Jan 1970/);
		});

		for (const value of ["1", "%7B%7D", "null"]) {
			test(`Should treat a malformed cookie value (${value}) as signed out`, async () => {
				const res = await api()
					.get("/users/profile")
					.set("Cookie", `${SESSION_COOKIE_NAME}=${value}`);

				assert.strictEqual(res.status, 401);
			});

			test(`Should let a user sign in over a malformed cookie (${value})`, async () => {
				const { user } = await signUp();

				const res = await api()
					.post("/auth/signin")
					.set("Cookie", `${SESSION_COOKIE_NAME}=${value}`)
					.send({ email: user.email, password: PASSWORD });

				assert.strictEqual(res.status, 200);
			});
		}

		test("Should return the server message for a wrong password", async () => {
			const { user } = await signUp();

			const res = await api()
				.post("/auth/signin")
				.send({ email: user.email, password: "WrongPassword999!" });

			assert.strictEqual(res.status, 401);
			assert.match(JSON.stringify(res.body), /Invalid email or password/);
		});
	});

	describe("sign-in", () => {
		test("Should replace the session sent with the sign-in request", async () => {
			const { cookie: oldCookie, user } = await signUp();

			const newCookie = await signIn(user.email, oldCookie);

			assert.notStrictEqual(newCookie, oldCookie);
			assert.strictEqual(await SessionModel.countDocuments(), 1);
			const oldRes = await api().get("/users/profile").set("Cookie", oldCookie);
			assert.strictEqual(oldRes.status, 401);
		});
	});

	describe("sessions", () => {
		test("Should list own sessions with the current one marked and no token hash", async () => {
			const { cookie, user } = await signUp();
			await signIn(user.email);

			const res = await api().get("/auth/sessions").set("Cookie", cookie);

			assert.strictEqual(res.status, 200);
			assert.strictEqual(res.body.data.length, 2);
			assert.strictEqual(
				res.body.data.filter(
					(session: { isCurrent: boolean }) => session.isCurrent,
				).length,
				1,
			);
			assert.strictEqual(res.body.data[0].userAgent, USER_AGENT);
			assert.ok(!JSON.stringify(res.body).includes("tokenHash"));
		});

		test("Should sign out the current session and clear the cookie", async () => {
			const { cookie } = await signUp();

			const res = await api()
				.delete("/auth/sessions/current")
				.set("Cookie", cookie);

			assert.strictEqual(res.status, 204);
			assert.match(getSessionSetCookie(res) ?? "", /Expires=Thu, 01 Jan 1970/);
			const afterSignOut = await api()
				.get("/users/profile")
				.set("Cookie", cookie);
			assert.strictEqual(afterSignOut.status, 401);
		});

		test("Should sign out every session of the user", async () => {
			const { cookie: firstCookie, user } = await signUp();
			const secondCookie = await signIn(user.email);

			const res = await api()
				.delete("/auth/sessions")
				.set("Cookie", firstCookie);

			assert.strictEqual(res.status, 204);
			const secondRes = await api()
				.get("/users/profile")
				.set("Cookie", secondCookie);
			assert.strictEqual(secondRes.status, 401);
			assert.strictEqual(await SessionModel.countDocuments(), 0);
		});
	});

	describe("password change", () => {
		test("Should sign out other sessions but keep the current one", async () => {
			const { cookie: currentCookie, user } = await signUp();
			const otherCookie = await signIn(user.email);

			const res = await api()
				.patch("/users/profile")
				.set("Cookie", currentCookie)
				.send({ currentPassword: PASSWORD, password: "NewPassword456!" });

			assert.strictEqual(res.status, 200);
			const current = await api()
				.get("/users/profile")
				.set("Cookie", currentCookie);
			assert.strictEqual(current.status, 200);
			const other = await api()
				.get("/users/profile")
				.set("Cookie", otherCookie);
			assert.strictEqual(other.status, 401);
		});

		test("Should keep other sessions when only the name changes", async () => {
			const { cookie: currentCookie, user } = await signUp();
			const otherCookie = await signIn(user.email);

			await api()
				.patch("/users/profile")
				.set("Cookie", currentCookie)
				.send({ name: "Renamed User" });

			const other = await api()
				.get("/users/profile")
				.set("Cookie", otherCookie);
			assert.strictEqual(other.status, 200);
		});
	});

	describe("ban", () => {
		test("Should sign out a banned user everywhere and block sign-in", async () => {
			const admin = await insertUser({ isAdmin: true });
			const adminCookie = await signIn(admin.email);
			const { cookie: userCookie, user } = await signUp();
			const userId = await getUserId(user.email);

			const banRes = await api()
				.patch(`/users/${userId}/ban`)
				.set("Cookie", adminCookie)
				.send({ banned: true });

			assert.strictEqual(banRes.status, 200);
			const profile = await api()
				.get("/users/profile")
				.set("Cookie", userCookie);
			assert.strictEqual(profile.status, 401);
			const signInRes = await api()
				.post("/auth/signin")
				.send({ email: user.email, password: PASSWORD });
			assert.strictEqual(signInRes.status, 403);
			assert.match(JSON.stringify(signInRes.body), /Account suspended/);
		});

		test("Should let a user sign in again after unban", async () => {
			const admin = await insertUser({ isAdmin: true });
			const adminCookie = await signIn(admin.email);
			const { user } = await signUp();
			const userId = await getUserId(user.email);
			await api()
				.patch(`/users/${userId}/ban`)
				.set("Cookie", adminCookie)
				.send({ banned: true });

			const unbanRes = await api()
				.patch(`/users/${userId}/ban`)
				.set("Cookie", adminCookie)
				.send({ banned: false });

			assert.strictEqual(unbanRes.status, 200);
			await signIn(user.email);
		});

		test("Should block a session that survived the ban (guard check)", async () => {
			const { cookie, user } = await signUp();
			await UserModel.updateOne(
				{ email: user.email },
				{ $set: { bannedAt: new Date() } },
			);

			const res = await api().get("/users/profile").set("Cookie", cookie);

			assert.strictEqual(res.status, 401);
			assert.strictEqual(await SessionModel.countDocuments(), 0);
		});

		const forbiddenCases = [
			{ name: "the admin themselves", target: "self" },
			{ name: "a demo account", target: "demo" },
		] as const;
		for (const { name, target } of forbiddenCases) {
			test(`Should not let an admin ban ${name}`, async () => {
				const admin = await insertUser({ isAdmin: true });
				const adminCookie = await signIn(admin.email);
				const targetId =
					target === "self"
						? admin.id
						: (
								await insertUser({
									email: DEMO_ACCOUNT_EMAILS.customer,
									isAdmin: false,
								})
							).id;

				const res = await api()
					.patch(`/users/${targetId}/ban`)
					.set("Cookie", adminCookie)
					.send({ banned: true });

				assert.strictEqual(res.status, 403);
			});
		}

		test("Should not let a regular user ban anyone", async () => {
			const { cookie } = await signUp();
			const other = await insertUser({ isAdmin: false });

			const res = await api()
				.patch(`/users/${other.id}/ban`)
				.set("Cookie", cookie)
				.send({ banned: true });

			assert.strictEqual(res.status, 403);
		});
	});

	describe("user deletion", () => {
		test("Should delete the sessions of a deleted user", async () => {
			const admin = await insertUser({ isAdmin: true });
			const adminCookie = await signIn(admin.email);
			const { user } = await signUp();
			const userId = await getUserId(user.email);

			const res = await api()
				.delete(`/users/${userId}`)
				.set("Cookie", adminCookie);

			assert.strictEqual(res.status, 204);
			assert.strictEqual(await SessionModel.countDocuments({ userId }), 0);
		});
	});
});
