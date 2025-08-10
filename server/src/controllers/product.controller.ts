import type { NextFunction, Request, Response } from "express";

import { z } from "zod";

import type { IProductService } from "../services/index.js";

import { insertProductSchema } from "../schemas/index.js";
import { ProductService } from "../services/index.js";
import {
  asyncHandler,
  removeEmptyFieldsSchema,
  sendSuccessResponse,
} from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IProductController {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getAll: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getTopRated: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export class ProductController implements IProductController {
  private readonly _service: IProductService;

  create = asyncHandler(async (req, res) => {
    const data = insertProductSchema.parse({
      ...req.body,
      image: req.file,
      user: res.locals.user._id,
    });

    const newProduct = await this._service.create(data);

    return sendSuccessResponse({
      data: newProduct,
      responseContext: res,
      statusCode: 201,
    });
  });

  delete = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    await this._service.delete({ productId });

    return sendSuccessResponse({
      data: null,
      responseContext: res,
      statusCode: 204,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const query = z
      .object({
        currentPage: z.coerce.number().int().positive().default(1),
        keyword: z.string().default(""),
      })
      .parse(req.query);

    const data = await this._service.getAll(query);

    return sendSuccessResponse({
      data: data.products,
      meta: {
        currentPage: data.currentPage,
        numberOfPages: data.numberOfPages,
      },
      responseContext: res,
      statusCode: 200,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);

    const product = await this._service.getById({ productId });

    return sendSuccessResponse({
      data: product,
      responseContext: res,
      statusCode: 200,
    });
  });

  getTopRated = asyncHandler(async (req, res) => {
    const products = await this._service.getTopRated();

    return sendSuccessResponse({
      data: products,
      responseContext: res,
      statusCode: 200,
    });
  });

  update = asyncHandler(async (req, res) => {
    const productId = objectIdValidator.parse(req.params.productId);
    const data = removeEmptyFieldsSchema(insertProductSchema.partial()).parse({
      ...req.body,
      image: req.file,
    });

    const updatedProduct = await this._service.update({
      data,
      productId,
    });

    return sendSuccessResponse({
      data: updatedProduct,
      responseContext: res,
      statusCode: 200,
    });
  });

  constructor(service: IProductService = new ProductService()) {
    this._service = service;
  }
}
