import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { productService } from "../services";
import { insertProductSchema, insertReviewSchema } from "../types";
import { formatZodErrors } from "../utils";
import { objectIdValidator } from "../validators";

class ProductController {
  private readonly service = productService;

  getById = async (req: Request, res: Response) => {
    try {
      const idRaw = req.params.id;
      const productId = objectIdValidator.parse(idRaw);
      const product = await this.service.getById({ productId });

      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodErrors(error) });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  getAll = async (req: Request, res: Response) => {
    // TODO: add types to the req.query
    try {
      const query = z
        .object({
          keyword: z.string(),
          currentPage: z.coerce.number().int().positive().min(1).default(1),
        })
        .parse(req.query);

      const data = await this.service.getAll(query);

      res.status(200).json({
        products: data.products,
        page: data.currentPage, // TODO: rename to pageNumber
        pages: data.numberOfPages, // TODO: rename to numberOfPages
      });
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodErrors(error) });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  getTopRated = async (req: Request, res: Response) => {
    try {
      const products = await this.service.getTopRated();

      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  create = async (req: Request, res: Response) => {
    const tempData = { ...req.body, user: res.locals.user._id };
    try {
      const data = insertProductSchema.parse(tempData);
      const newProduct = await this.service.create(data);

      res.status(201).json(newProduct);
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodErrors(error) });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  createReview = async (req: Request, res: Response) => {
    const user = res.locals.user;
    try {
      const productId = objectIdValidator.parse(req.params.id);

      const data = insertReviewSchema
        .pick({ rating: true, comment: true })
        .parse({ rating: req.body.rating, comment: req.body.comment });

      await this.service.createReview({
        user,
        productId,
        rating: data.rating,
        comment: data.comment,
      });

      res.status(201).json({ message: "review added" });
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodErrors(error) });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const productId = objectIdValidator.parse(req.params.id);
      const updateData = insertProductSchema.partial().parse(req.body);

      const updatedProduct = await this.service.update({
        productId,
        updateData,
      });

      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodErrors(error) });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const productId = objectIdValidator.parse(req.params.id);
      await this.service.delete({ productId });

      res.status(200).json({ message: "Product removed" });
    } catch (error) {
      console.error(error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: formatZodErrors(error) });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };
}

export const productController = new ProductController();
