import { Request, Response } from "express";
import { productService } from "../services";
import { TInsertProduct } from "../types";

class ProductController {
  private readonly service = productService;

  getById = async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const product = await this.service.getById({ productId });
      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  getAll = async (req: Request, res: Response) => {
    // TODO: add types to the req.query
    const currentPage = req.query.pageNumber as unknown as number;
    const keyword = req.query.keyword as unknown as string;

    try {
      const data = await this.service.getAll({ keyword, currentPage });
      res.status(200).json({
        products: data.products,
        page: data.currentPage, // TODO: rename to pageNumber
        pages: data.numberOfPages, // TODO: rename to numberOfPages
      });
    } catch (error) {
      console.error(error);
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
    const data = req.body;
    try {
      const tempProduct: TInsertProduct = {
        ...data,
        user: res.locals.user._id,
      };
      const newProduct = await this.service.create(tempProduct);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  createReview = async (req: Request, res: Response) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const user = res.locals.user;

    try {
      await this.service.createReview({
        user,
        productId,
        rating,
        comment,
      });
      res.status(201).json({ message: "review added" });
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  update = async (req: Request, res: Response) => {
    const productId = req.params.id;
    const updateData = req.body;

    try {
      const updatedProduct = await this.service.update({
        productId,
        updateData,
      });
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  delete = async (req: Request, res: Response) => {
    const productId = req.params.id;

    try {
      await this.service.delete({ productId });
      res.status(200).json({ message: "Product removed" });
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };
}

export const productController = new ProductController();
