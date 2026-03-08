import type { ZodError } from "zod";

type ZodErrorTypeTesting = Pick<ZodError, "issues">;

export const mockZodError1: ZodErrorTypeTesting = {
	issues: [
		{
			code: "invalid_type",
			expected: "string",
			message: "Name is required",
			path: ["user", "name"],
			input: undefined,
		},
	],
};

export const mockZodError2: ZodErrorTypeTesting = {
	issues: [
		{
			code: "invalid_type",
			expected: "string",
			message: "Invalid email format",
			path: ["user", "email"],
			input: undefined,
		},
	],
};

export const mockZodError3: ZodErrorTypeTesting = {
	issues: [
		{
			code: "too_small",
			inclusive: true,
			message: "Password should be at least 6 characters long",
			minimum: 8,
			path: ["user", "password"],
			origin: "number",
		},
	],
};

export const mockZodErrors = {
	issues: [mockZodError1, mockZodError2, mockZodError3].reduce(
		(acc, cur) => {
			return [...acc, ...cur.issues];
		},
		[] as ZodError["issues"],
	),
};
