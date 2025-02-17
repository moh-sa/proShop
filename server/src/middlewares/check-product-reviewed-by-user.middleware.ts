import { reviewService } from "../services";
import { asyncHandler } from "../utils";
import { objectIdValidator } from "../validators";

export const checkProductReviewedByUser = asyncHandler(
  async (req, res, next) => {
    const userId = res.locals.user._id;
    const productId = objectIdValidator.parse(req.params.productId);

    // Will throw 'NotFound' error if doesn't exist
    await reviewService.existsByUserIdAndProductId({
      userId,
      productId,
    });

    next();
  },
);
