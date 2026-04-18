import {
	ForbiddenError,
	InternalError,
	ValidationError,
} from "../errors/index.js";
import { reviewService } from "../services/review.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { objectIdStringValidator } from "../validators/object-id.validator.js";

/**
 * Verify Review Ownership Middleware
 *
 * Verifies that the user is the owner of the review.
 *
 * This middleware must be used *after* `checkUserExists` middleware.
 */
export const verifyReviewOwnership = asyncHandler(async (req, res, next) => {
	// Get user from res.locals
	const user = res.locals.user;
	if (!user) {
		return next(new InternalError("User not found in res.locals."));
	}

	const userId = user.id;

	// Get and verify reviewId from params
	const reviewId = req.params.reviewId;
	const verifyReviewIdResult = objectIdStringValidator.safeParse(reviewId);
	if (!verifyReviewIdResult.success) {
		return next(
			new ValidationError("Missing or invalid review id.", {
				cause: verifyReviewIdResult.error,
				received: reviewId,
			}),
		);
	}

	// Verify review ownership
	const reviewExistsResult = await reviewService.getById({
		reviewId: verifyReviewIdResult.data,
	});
	if (!reviewExistsResult.success) {
		return next(reviewExistsResult.error);
	}

	const isAdmin = user.isAdmin;
	const isUserIdMatch = userId === reviewExistsResult.data.user.id;

	if (!isUserIdMatch && !isAdmin) {
		return next(
			new ForbiddenError("You do not have permission to modify this review."),
		);
	}

	next();
});
