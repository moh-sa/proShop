import { AuthorizationError } from "../errors/index.js";
import { ReviewService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";
import { objectIdStringValidator } from "../validators/index.js";

const reviewService = new ReviewService();

export const verifyReviewOwnership = asyncHandler<{
	params: { reviewId: string };
	resBody: { data: null };
}>(async (req, res, next) => {
	const rawReviewId = req.params.reviewId;
	const reviewId = objectIdStringValidator("Review ID").parse(rawReviewId);

	const userId = res.locals.user._id;

	const review = await reviewService.getById({ reviewId });
	if (!review.success) {
		throw review.error;
	}

	const isOwner = review.data.user.toString() === userId.toString();
	const isAdmin = res.locals.user.isAdmin;
	if (!isOwner && !isAdmin) {
		throw new AuthorizationError();
	}

	res.locals.review = review.data;

	next();
});
