import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { NotFoundError } from "../errors";
import { insertProductSchema } from "../schemas";
import { IProductService, ProductService } from "../services";
import { asyncHandler, removeEmptyFieldsSchema } from "../utils";
import { objectIdValidator } from "../validators";

export interface IProductController {
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getTopRated: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export class ProductController implements IProductController {
  private readonly service: IProductService;

  constructor(service: IProductService = new ProductService()) {
    this.service = service;
  }

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
      image: req.file,
      user: res.locals.user._id,
    });

    const newProduct = await this.service.create(data);

    res.status(201).json(newProduct);
  });

  update = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);
    const data = removeEmptyFieldsSchema(insertProductSchema).parse({
      ...req.body,
      image: req.file,
    });

    const updatedProduct = await this.service.update({
      productId,
      data,
    });

    res.status(200).json(updatedProduct);
  });

  delete = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    await this.service.delete({ productId });

    res.status(200).json({ message: "Product removed" });
  });
}
