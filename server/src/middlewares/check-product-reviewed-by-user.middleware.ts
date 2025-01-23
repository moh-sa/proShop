import { productService } from "../services";
import { asyncHandler } from "../utils";
import { objectIdValidator } from "../validators";

export const checkProductReviewedByUser = asyncHandler(
  async (req, res, next) => {
    const userId = res.locals.user._id;
    const productId = objectIdValidator.parse(req.params.productId);

    const isReviewed = await productService.isReviewedByUser({
      productId,
      userId,
    });

    if (!isReviewed) next();
  },
);
