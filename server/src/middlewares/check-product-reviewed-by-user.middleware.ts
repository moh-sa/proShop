import { ReviewService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";
import { objectIdStringValidator } from "../validators/index.js";

const reviewService = new ReviewService();

export const checkProductReviewedByUser = asyncHandler<{
	params: { productId: string };
	resBody: { data: null };
}>(async (req, res, next) => {
	const userId = res.locals.user._id;
	const productId = objectIdStringValidator("Product ID").parse(
		req.params.productId,
	);

	// Will throw 'NotFound' error if doesn't exist
	await reviewService.existsByUserIdAndProductId({
		productId,
		userId: userId.toString(),
	});

	next();
});
