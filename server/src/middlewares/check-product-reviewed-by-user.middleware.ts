import { NextFunction, Request, Response } from "express";
import { productService } from "../services";
import { objectIdValidator } from "../validators";

export async function checkProductReviewedByUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const productIdParsed = objectIdValidator.safeParse(req.params.id);
  if (!productIdParsed.success) {
    return res.status(400).json({
      message: "Invalid user id format.",
    });
  }

  const productId = productIdParsed.data;
  const userId = res.locals.user._id;

  const isReviewed = await productService.isReviewedByUser({
    productId,
    userId,
  });
  if (isReviewed) {
    return res.status(400).json({ message: "Product already reviewed" });
  }

  next();
}
