import { describe, suite } from "node:test";

suite(
	"Middlewares 〖 Unit Tests 〗",
	{
		todo: "waiting 'mock.module' to be stable...",
	},
	() => {
		describe("checkUserIdExists", { skip: true }, () => {});

		describe("checkIfUserIsAdmin", { skip: true }, () => {});

		describe("verifyReviewOwnership", { skip: true }, () => {});

		describe("checkProductReviewedByUser", { skip: true }, () => {});

		describe("RateLimiterMiddleware", { skip: true }, () => {});

		describe("errorHandlerMiddleware", { skip: true }, () => {});
	},
);
