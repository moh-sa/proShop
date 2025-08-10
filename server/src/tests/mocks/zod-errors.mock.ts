import type { ZodError } from "zod";

type ZodErrorTypeTesting = Pick<ZodError, "errors">;
export const mockZodError1: ZodErrorTypeTesting = {
  errors: [
    {
      code: "invalid_type",
      expected: "string",
      message: "Name is required",
      path: ["user", "name"],
      received: "undefined",
    },
  ],
};

export const mockZodError2: ZodErrorTypeTesting = {
  errors: [
    {
      code: "invalid_type",
      expected: "string",
      message: "Invalid email format",
      path: ["user", "email"],
      received: "undefined",
    },
  ],
};

export const mockZodError3: ZodErrorTypeTesting = {
  errors: [
    {
      code: "too_small",
      inclusive: true,
      message: "Password should be at least 6 characters long",
      minimum: 8,
      path: ["user", "password"],
      type: "number",
    },
  ],
};

export const mockZodErrors = {
  errors: [mockZodError1, mockZodError2, mockZodError3].reduce((acc, cur) => {
    return [...acc, ...cur.errors];
  }, [] as ZodError["errors"]),
};
