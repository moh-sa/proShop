import { AuthorizationError } from "../errors/index.js";
import { ReviewService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

const reviewService = new ReviewService();

export const verifyReviewOwnership = asyncHandler<{
	params: { reviewId: string };
	resBody: { data: null };
}>(async (req, res, next) => {
	const rawReviewId = req.params.reviewId;
	const reviewId = objectIdValidator.parse(rawReviewId);

	const userId = res.locals.user._id;

	const review = await reviewService.getById({ reviewId });

	const isOwner = review.user.toString() === userId.toString();
	const isAdmin = res.locals.user.isAdmin;
	if (!isOwner && !isAdmin) {
		throw new AuthorizationError();
	}

	res.locals.review = review;

	next();
});
