import { productService } from "../services";
import { asyncHandler } from "../utils";
import { objectIdValidator } from "../validators";

export const checkProductReviewedByUser = asyncHandler(
  async (req, res, next) => {
    const userId = res.locals.user._id;
    const productId = objectIdValidator.parse(req.params.id);

    const isReviewed = await productService.isReviewedByUser({
      productId,
      userId,
    });

    if (isReviewed) {
      return res.status(400).json({ message: "Product already reviewed" });
    }
    next();
  },
);
