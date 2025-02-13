import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { productController } from "../../controllers";
import { NotFoundError } from "../../errors";
import Product from "../../models/productModel";
import { productRepository } from "../../repositories";
import {
  generateMockProduct,
  generateMockProducts,
  generateMockUser,
} from "../mocks";
import {
  createMockExpressContext,
  dbClose,
  dbConnect,
  findTopRatedProduct,
} from "../utils";

const controller = productController;

before(async () => await dbConnect());
after(async () => await dbClose());

beforeEach(async () => {
  productRepository._invalidateCache();
  await Product.deleteMany({});
});

suite("Product Controller", () => {
  describe("Create Product", () => {
    test("Should create new product and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockProduct();
      const mockUser = generateMockUser();

      res.locals.user = mockUser;
      req.body = mockProduct;

      await controller.create(req, res, next);

      assert.equal(res.statusCode, 201);

      const data = res._getJSONData();
      assert.equal(data.name, mockProduct.name);
    });

    test("Should throw 'ZodError' if the 'product' data is invalid", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      res.locals.user = mockUser;
      try {
        await controller.create(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 5); // number of required fields in 'product' model
      }
    });
  });

  describe("Retrieve Product By ID", () => {
    test("Should retrieve product by ID and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockProduct();

      const product = await Product.create(mockProduct);
      req.params.productId = product._id.toString();

      await controller.getById(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.name, mockProduct.name);
    });

    test("Should throw 'NotFoundError' if product does not exist", async () => {
      const { req, res, next } = createMockExpressContext();

      req.params.productId = generateMockProduct()._id.toString();

      try {
        await controller.getById(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.message, "Product not found");
        assert.equal(error.statusCode, 404);
      }
    });

    test("Should throw 'ZodError' if the 'productId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.productId = "RANDOM_STRING";

      try {
        await controller.getById(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });

  describe("Retrieve Products", () => {
    test("Should retrieve all products and return 200 with array of data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      req.query = {
        keyword: "",
        currentPage: "1",
      };

      await controller.getAll(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.products.length, 4);
      assert.equal(data.page, 1);
      assert.equal(data.pages, 1);
    });

    test("Should retrieve 10 products per page on 2 pages", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockProducts(20);

      await Product.insertMany(mockProducts);

      req.query = {
        keyword: "",
        currentPage: "1",
      };

      await controller.getAll(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.products.length, 10);
      assert.equal(data.page, 1);
      assert.equal(data.pages, 2);
    });

    test("Should return empty array if no products exist", async () => {
      const { req, res, next } = createMockExpressContext();

      req.query = {
        keyword: "",
        currentPage: "1",
      };

      await controller.getAll(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.products.length, 0);
    });

    test("Should return array of products with a specific name", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      req.query = {
        keyword: mockProducts[0].name,
        currentPage: "1",
      };

      await controller.getAll(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.products.length, 1);
      assert.equal(data.products[0].name, mockProducts[0].name);
    });
  });

  describe("Retrieve Top Rated Products", () => {
    test("Should retrieve 3 top rated products", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      await controller.getTopRated(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 3);

      const topRatedProduct = findTopRatedProduct(mockProducts);
      assert.equal(data[0].name, topRatedProduct.name);
    });

    test("Should return an empty array if no products exist", async () => {
      const { req, res, next } = createMockExpressContext();

      await controller.getTopRated(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 0);
    });
  });

  describe("Update Product", () => {
    test("Should update product and return 200 with updated data", async () => {
      const { req, res, next } = createMockExpressContext();
      const [mockProduct1, mockProduct2] = generateMockProducts(2);

      const product = await Product.create(mockProduct1);

      req.params.productId = product._id.toString();
      req.body = { name: mockProduct2.name };
      await controller.update(req, res, next);

      assert.equal(res.statusCode, 200);

      const data = res._getJSONData();
      assert.equal(data.name, mockProduct2.name);
    });

    test("Should throw 'NotFoundError' if product does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const [mockProduct1, mockProduct2] = generateMockProducts(2);

      req.params.productId = mockProduct1._id.toString();
      req.body = { name: mockProduct2.name };
      try {
        await controller.update(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Product not found");
      }
    });

    test("Should throw 'ZodError' if the 'productId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.productId = "RANDOM_STRING";
      req.body = { name: "RANDOM_NAME" };

      try {
        await controller.update(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });

    test("Should throw 'ZodError' if the update data is not a valid", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockProduct();

      const product = await Product.create(mockProduct);
      req.params.productId = product._id.toString();
      req.body = { brand: 123456 };

      try {
        await controller.update(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].path[0], "brand");
        assert.equal(
          error.issues[0].message,
          "Expected string, received number",
        );
      }
    });
  });

  describe("Delete Product", () => {
    test("Should delete product and return 200 with message", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockProduct();

      const product = await Product.create(mockProduct);
      req.params.productId = product._id.toString();

      await controller.delete(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.message, "Product removed");
    });

    test("Should throw 'NotFoundError' if product does not exist", async () => {
      const { req, res, next } = createMockExpressContext();

      req.params.productId = generateMockProduct()._id.toString();

      try {
        await controller.delete(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Product not found");
      }
    });

    test("Should throw 'ZodError' if the 'productId' is not a valid ObjectId", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.productId = "RANDOM_STRING";

      try {
        await controller.delete(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues.length, 1);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });
  });
});
