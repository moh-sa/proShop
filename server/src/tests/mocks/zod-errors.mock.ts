import { ZodError } from "zod";

type ZodErrorTypeTesting = Pick<ZodError, "errors">;
export const mockZodError1: ZodErrorTypeTesting = {
  errors: [
    {
      path: ["user", "name"],
      message: "Name is required",
      code: "invalid_type",
      expected: "string",
      received: "undefined",
    },
  ],
};

export const mockZodError2: ZodErrorTypeTesting = {
  errors: [
    {
      path: ["user", "email"],
      message: "Invalid email format",
      code: "invalid_type",
      expected: "string",
      received: "undefined",
    },
  ],
};

export const mockZodError3: ZodErrorTypeTesting = {
  errors: [
    {
      path: ["user", "password"],
      message: "Password should be at least 6 characters long",
      code: "too_small",
      minimum: 8,
      inclusive: true,
      type: "number",
    },
  ],
};

export const mockZodErrors = {
  errors: [mockZodError1, mockZodError2, mockZodError3].reduce((acc, cur) => {
    return [...acc, ...cur.errors];
  }, [] as ZodError["errors"]),
};
