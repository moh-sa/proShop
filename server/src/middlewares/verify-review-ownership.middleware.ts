import { AuthorizationError } from "../errors";
import { reviewService } from "../services";
import { asyncHandler } from "../utils";
import { objectIdValidator } from "../validators";

export const verifyReviewOwnership = asyncHandler(async (req, res, next) => {
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
