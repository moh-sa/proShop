import { z } from "zod";
import { NotFoundError } from "../errors";
import { insertProductSchema, insertReviewSchema } from "../schemas";
import { productService } from "../services";
import { asyncHandler } from "../utils";
import { objectIdValidator } from "../validators";

class ProductController {
  private readonly service = productService;

  getById = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const product = await this.service.getById({ productId });
    if (!product) throw new NotFoundError("Product");

    res.status(200).json(product);
  });

  getAll = asyncHandler(async (req, res) => {
    const query = z
      .object({
        keyword: z.string(),
        currentPage: z.coerce.number().int().positive().default(1),
      })
      .parse(req.query);

    const data = await this.service.getAll(query);

    res.status(200).json({
      products: data.products,
      page: data.currentPage,
      pages: data.numberOfPages,
    });
  });

  getTopRated = asyncHandler(async (req, res) => {
    const products = await this.service.getTopRated();

    res.status(200).json(products);
  });

  create = asyncHandler(async (req, res) => {
    const data = insertProductSchema.parse({
      ...req.body,
      user: res.locals.user._id,
    });

    const newProduct = await this.service.create(data);

    res.status(201).json(newProduct);
  });

  createReview = asyncHandler(async (req, res) => {
    const user = res.locals.user;
    const productId = objectIdValidator.parse(req.params.productId);
    const { comment, rating } = insertReviewSchema
      .pick({ rating: true, comment: true })
      .parse({ rating: req.body.rating, comment: req.body.comment });

    await this.service.createReview({
      user,
      productId,
      rating,
      comment,
    });

    res.status(201).json({ message: "review added" });
  });

  update = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.id);
    const updateData = insertProductSchema.partial().parse(req.body);

    const updatedProduct = await this.service.update({
      productId,
      updateData,
    });

    res.status(200).json(updatedProduct);
  });

  delete = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.id);

    await this.service.delete({ productId });

    res.status(200).json({ message: "Product removed" });
  });
}

export const productController = new ProductController();
