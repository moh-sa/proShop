import {
	ConflictError,
	InternalError,
	ValidationError,
} from "../errors/index.js";
import { reviewService } from "../services/review.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { objectIdValidator } from "../validators/object-id.validator.js";

/**
 * Check Product Reviewed By User Middleware
 *
 * Checks that the product is reviewed by the user.
 *
 * This middleware must be used *after* `checkUserExists` middleware.
 */
export const checkProductReviewedByUser = asyncHandler(
	async (req, res, next) => {
		// Get userId from res.locals.userId
		const user = res.locals.user;
		if (!user) {
			return next(new InternalError("User not found in res.locals."));
		}

		const userId = user._id.toString();

		// Get and verify productId from params
		const productId = req.params.productId;

		const verifyProductIdResult = objectIdValidator.safeParse(productId);
		if (!verifyProductIdResult.success) {
			return next(
				new ValidationError("Missing or invalid product id.", {
					cause: verifyProductIdResult.error,
					received: productId,
				}),
			);
		}

		// Verify product is reviewed by user
		const reviewExistsResult = await reviewService.existsByUserIdAndProductId({
			productId: verifyProductIdResult.data.toString(),
			userId,
		});

		if (reviewExistsResult.success) {
			return next(new ConflictError("Product already reviewed by the user."));
		}

		next();
	},
);
