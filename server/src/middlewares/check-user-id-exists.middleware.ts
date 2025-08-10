import { AuthenticationError } from "../errors/index.js";
import { UserRepository } from "../repositories/index.js";
import { asyncHandler } from "../utils/index.js";

const userRepository = new UserRepository();

/**
 * Middleware to verify user existence by ID
 */
export const checkUserIdExists = asyncHandler(async (req, res, next) => {
	const userId = res.locals.token._id;
	const user = await userRepository.getById({ userId });
	if (!user) {
		throw new AuthenticationError();
	}

	// eslint-disable-next-line require-atomic-updates
	res.locals.user = user;

	next();
});
