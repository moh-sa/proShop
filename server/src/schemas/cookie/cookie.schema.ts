import z from "zod";

export const cookieNameSchema = z.enum(["accessToken", "refreshToken"]);
