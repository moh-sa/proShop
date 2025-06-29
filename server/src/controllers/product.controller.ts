import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { NotFoundError } from "../errors";
import { insertProductSchema } from "../schemas";
import { IProductService, ProductService } from "../services";
import {
  asyncHandler,
  removeEmptyFieldsSchema,
  sendSuccessResponse,
} from "../utils";
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
  private readonly _service: IProductService;

  constructor(service: IProductService = new ProductService()) {
    this._service = service;
  }

  getById = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const product = await this._service.getById({ productId });
    if (!product) throw new NotFoundError("Product");

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: product,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const query = z
      .object({
        keyword: z.string().default(""),
        currentPage: z.coerce.number().int().positive().default(1),
      })
      .parse(req.query);

    const data = await this._service.getAll(query);

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: data.products,
      meta: {
        currentPage: data.currentPage,
        numberOfPages: data.numberOfPages,
      },
    });
  });

  getTopRated = asyncHandler(async (req, res) => {
    const products = await this._service.getTopRated();

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: products,
    });
  });

  create = asyncHandler(async (req, res) => {
    const data = insertProductSchema.parse({
      ...req.body,
      image: req.file,
      user: res.locals.user._id,
    });

    const newProduct = await this._service.create(data);

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 201,
      data: newProduct,
    });
  });

  update = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);
    const data = removeEmptyFieldsSchema(insertProductSchema.partial()).parse({
      ...req.body,
      image: req.file,
    });

    const updatedProduct = await this._service.update({
      productId,
      data,
    });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 200,
      data: updatedProduct,
    });
  });

  delete = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    await this._service.delete({ productId });

    return sendSuccessResponse({
      responseContext: res,
      statusCode: 204,
      data: null,
    });
  });
}
