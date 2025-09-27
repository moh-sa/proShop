import { ReviewService } from "../services/index.js";
import { strictAsyncHandler } from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

const reviewService = new ReviewService();

export const checkProductReviewedByUser = strictAsyncHandler<{
	params: { productId: string };
	resBody: { data: null };
}>(async (req, res, next) => {
	const userId = res.locals.user._id;
	const productId = objectIdValidator.parse(req.params.productId);

	// Will throw 'NotFound' error if doesn't exist
	await reviewService.existsByUserIdAndProductId({
		productId,
		userId,
	});

	next();
});
