import { insertReviewSchema } from "../schemas";
import { reviewService } from "../services";
import { asyncHandler } from "../utils";
import { objectIdValidator } from "../validators";

class ReviewController {
  private readonly service = reviewService;

  create = asyncHandler(async (req, res) => {
    const data = insertReviewSchema.parse({
      ...req.body,
      user: res.locals.user._id,
      name: res.locals.user.name,
    });

    const newReview = await this.service.create({ data });

    res.status(201).json(newReview);
  });

  getById = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    const review = await this.service.getById({ reviewId });

    res.status(200).json(review);
  });

  getAll = asyncHandler(async (req, res) => {
    const reviews = await this.service.getAll();
    res.status(200).json(reviews);
  });

  getAllByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const reviews = await this.service.getAllByUserId({ userId });

    res.status(200).json(reviews);
  });

  getAllByProductId = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const reviews = await this.service.getAllByProductId({ productId });

    res.status(200).json(reviews);
  });

  update = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);
    const updateData = insertReviewSchema.partial().parse(req.body);

    const updatedReview = await this.service.update({
      reviewId,
      data: updateData,
    });

    res.status(200).json(updatedReview);
  });

  delete = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    await this.service.delete({ reviewId });

    res.status(200).json({ message: "Review removed" });
  });

  count = asyncHandler(async (req, res) => {
    const count = await this.service.count();

    res.status(200).json({ count });
  });

  countByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const count = await this.service.countByUserId({ userId });

    res.status(200).json({ count });
  });

  countByProductId = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const count = await this.service.countByProductId({ productId });

    res.status(200).json({ count });
  });

  existsById = asyncHandler(async (req, res) => {
    const reviewId = objectIdValidator.parse(req.params.reviewId);

    const exists = await this.service.existsById({ reviewId });

    res.status(200).json(exists);
  });

  existsByUserIdAndProductId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);
    const productId = objectIdValidator.parse(req.params.productId);

    const exists = await this.service.existsByUserIdAndProductId({
      userId,
      productId,
    });

    res.status(200).json(exists);
  });
}

export const reviewController = new ReviewController();
