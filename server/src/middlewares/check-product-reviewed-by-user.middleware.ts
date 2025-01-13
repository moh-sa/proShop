import { NextFunction, Request, Response } from "express";
import { productService } from "../services";

export async function checkProductReviewedByUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const productId = req.params.id;
  const userId = res.locals.user._id as unknown as string; // TODO: fix type

  const isReviewed = await productService.isReviewedByUser({
    productId,
    userId,
  });
  if (isReviewed) {
    return res.status(400).json({ message: "Product already reviewed" });
  }

  next();
}
