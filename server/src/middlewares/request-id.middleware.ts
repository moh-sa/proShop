import { randomUUID } from "node:crypto";

import { asyncHandler } from "../utils/async-handler.util.js";

export const requestId = asyncHandler(async (req, res, next) => {
	const requestId = (req.headers["x-request-id"] as string) || randomUUID();
	req.id = requestId;
	res.setHeader("x-request-id", requestId);
	next();
});
