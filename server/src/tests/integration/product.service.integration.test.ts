import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { DatabaseError, NotFoundError } from "../../errors";
import { CacheManager } from "../../managers";
import Product from "../../models/productModel";
import { ProductRepository } from "../../repositories";
import { ProductService } from "../../services";
import {
  generateMockInsertProductWithMulterImage,
  generateMockInsertProductWithStringImage,
  generateMockObjectId,
  generateMockSelectProducts,
} from "../mocks";
import { mockImageStorage } from "../mocks/image-storage.mock";
import { dbClose, dbConnect, findTopRatedProduct } from "../utils";

const service = new ProductService(new ProductRepository(), mockImageStorage());
const cache = CacheManager.getInstance("product");

before(async () => await dbConnect());
after(async () => await dbClose());

beforeEach(async () => {
  cache.flush();
  await Product.deleteMany({});
});

suite("Product Service", () => {
  describe("Create Product", () => {
    test("Should create new product and return the data", async () => {
      const mockProduct = generateMockInsertProductWithMulterImage();

      const response = await service.create(mockProduct);

      assert.ok(response);
      assert.equal(response.name, mockProduct.name);
      assert.equal(response.description, mockProduct.description);
    });

    test("Should throw 'NotFoundError' if product does not exist", async () => {
      const mockProduct = generateMockInsertProductWithMulterImage();

      await service.create(mockProduct);
      try {
        // creating new product with the same name
        await service.create(mockProduct);
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.statusCode, 500);
        assert.ok(error.message.includes("E11000")); // error code for duplication
      }
    });
  });

  describe("Retrieve Product By ID", () => {
    test("Should retrieve a product by ID", async () => {
      const mockProduct = generateMockInsertProductWithMulterImage();
      const created = await service.create(mockProduct);

      const response = await service.getById({ productId: created._id });

      assert.ok(response);
      assert.equal(response.name, mockProduct.name);
    });

    test("Should throw 'NotFoundError' if product does not exist", async () => {
      const mockProductId = generateMockObjectId();
      try {
        await service.getById({ productId: mockProductId });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
      }
    });
  });

  describe("Retrieve Products", () => {
    test("Should retrieve all products", async () => {
      const mockProducts = generateMockSelectProducts({ count: 4 });
      await Product.insertMany(mockProducts);

      const response = await service.getAll({
        keyword: "",
        currentPage: 1,
      });

      assert.ok(response);
      assert.equal(response.products.length, 4);
      assert.equal(response.currentPage, 1);
      assert.equal(response.numberOfPages, 1);
    });

    test("Should retrieve 10 products per page on 2 pages", async () => {
      const mockProducts = generateMockSelectProducts({ count: 20 });
      await Product.insertMany(mockProducts);

      const response = await service.getAll({
        keyword: "",
        currentPage: 1,
      });

      assert.ok(response);
      assert.equal(response.products.length, 10);
      assert.equal(response.currentPage, 1);
      assert.equal(response.numberOfPages, 2);
    });

    test("Should return empty array if no products exist", async () => {
      const response = await service.getAll({
        keyword: "",
        currentPage: 1,
      });

      assert.ok(response);
      assert.equal(response.products.length, 0);
    });
  });

  describe("Retrieve Top Rated Products", () => {
    test("Should retrieve 3 top rated products", async () => {
      const mockProducts = generateMockSelectProducts({ count: 4 });
      await Product.insertMany(mockProducts);

      const response = await service.getTopRated();

      assert.ok(response);
      assert.equal(response.length, 3);

      const topRatedProduct = findTopRatedProduct(mockProducts);
      assert.equal(response[0].name, topRatedProduct.name);
    });

    test("Should return an empty array if no products exist", async () => {
      const response = await service.getTopRated();

      assert.ok(response);
      assert.equal(response.length, 0);
    });
  });

  describe("Update Product", () => {
    test("Should find and update product", async () => {
      const mockProduct = generateMockInsertProductWithStringImage();
      const created = await Product.create(mockProduct);

      const data = { name: "RANDOM_NAME" };
      const updatedProduct = await service.update({
        productId: created._id,
        data,
      });

      assert.ok(updatedProduct);
      assert.notEqual(updatedProduct.name, mockProduct.name);
      assert.equal(updatedProduct.name, data.name);
    });

    test("Should throw 'NotFoundError' if product does not exist", async () => {
      try {
        const mockProductId = generateMockObjectId();

        await service.update({
          productId: mockProductId,
          data: { name: "RANDOM_NAME" },
        });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Product not found");
      }
    });
  });

  describe("Delete Product", () => {
    test("Should delete product and throw 'NotFoundError' to ensure the product is deleted", async () => {
      const mockProduct = generateMockInsertProductWithMulterImage();
      const created = await service.create(mockProduct);

      await service.delete({ productId: created._id });

      try {
        await service.getById({ productId: created._id });
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Product not found");
      }
    });
  });
});
