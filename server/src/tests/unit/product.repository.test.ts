import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import Product from "../../models/productModel";
import User from "../../models/userModel";
import { productRepository } from "../../repositories/product.repository";
import {
  mockObjectid1,
  mockProduct1,
  mockProduct2,
  mockProduct3,
  mockProduct4,
  mockUser1,
  mockUser2,
  mockUser3,
  mockUser4,
} from "../mocks";
import { dbClose, dbConnect } from "../utils";

const repo = productRepository;

before(async () => {
  await dbConnect();
  await User.create([
    mockUser1.select,
    mockUser2.select,
    mockUser3.select,
    mockUser4.select,
  ]);
});
after(async () => {
  await dbClose();
});
beforeEach(async () => {
  repo._invalidateCache();
  await Product.deleteMany({});
});

suite("Product Repository", () => {
  describe("Create Product", () => {
    test("Should create new product in the database", async () => {
      const product = await repo.createProduct({
        productData: mockProduct1.insert,
      });

      assert.ok(product);

      assert.equal(product.name, mockProduct1.select.name);
      assert.equal(product.description, mockProduct1.select.description);

      assert.equal(product.reviews.length, mockProduct1.insert.reviews.length);
    });
  });

  describe("Retrieve Product By Id", () => {
    test("Should retrieve a product by id", async () => {
      const created = await Product.create(mockProduct1.insert);

      const product = await repo.getProductById({ productId: created._id });
      assert.ok(product);
      assert.equal(product.name, mockProduct1.select.name);
    });

    test("Should return null if product does not exist", async () => {
      const product = await repo.getProductById({ productId: mockObjectid1 });
      assert.equal(product, null);
    });
  });

  describe("Retrieve Top Products", () => {
    test("Should retrieve 3 top rated products", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const products = await repo.getTopRatedProducts({ limit: 3 });
      assert.ok(products);
      assert.equal(products.length, 3);
      assert.equal(products[0].name, mockProduct3.insert.name);
    });

    test("Should return an empty array if no products exist", async () => {
      const products = await repo.getTopRatedProducts({ limit: 3 });

      assert.ok(products);
      assert.equal(products.length, 0);
    });
  });

  describe("Retrieve Products", () => {
    test("Should retrieve all products on one page", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const products = await repo.getAllProducts({
        query: {},
        currentPage: 1,
        numberOfProductsPerPage: 4,
      });

      assert.ok(products);
      assert.equal(products.length, 4);
      assert.equal(products[0].name, mockProduct1.select.name);
    });

    test("Should retrieve all products on 2 pages", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const firstPage = await repo.getAllProducts({
        query: {},
        currentPage: 1,
        numberOfProductsPerPage: 2,
      });

      assert.ok(firstPage);
      assert.equal(firstPage.length, 2);
      assert.equal(firstPage[0].name, mockProduct1.select.name);

      const secondPage = await repo.getAllProducts({
        query: {},
        currentPage: 2,
        numberOfProductsPerPage: 2,
      });

      assert.ok(secondPage);
      assert.equal(secondPage.length, 2);
      assert.equal(secondPage[0].name, mockProduct3.select.name);
    });

    test("Should retrieve the correct number of products when the number of products per page is greater than the total number of products", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const firstPage = await repo.getAllProducts({
        query: {},
        currentPage: 1,
        numberOfProductsPerPage: 10,
      });

      assert.ok(firstPage);
      assert.equal(firstPage.length, 4);

      const secondPage = await repo.getAllProducts({
        query: {},
        currentPage: 2,
        numberOfProductsPerPage: 10,
      });

      assert.ok(secondPage);
      assert.equal(secondPage.length, 0);
    });

    test("Should retrieve products with a specific name", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const products = await repo.getAllProducts({
        query: { name: mockProduct2.select.name },
        currentPage: 1,
        numberOfProductsPerPage: 10,
      });

      assert.ok(products);
      assert.equal(products.length, 1);
      assert.equal(products[0].name, mockProduct2.select.name);
    });

    test("Should return empty array", async () => {
      const products = await repo.getAllProducts({
        query: {},
        currentPage: 1,
        numberOfProductsPerPage: 4,
      });

      assert.ok(products);
      assert.equal(products.length, 0);
    });
  });

  describe("Count Products", () => {
    test("Should count all products and return number 4", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const count = await repo.count({ query: {} });
      assert.equal(count, 4);
    });

    test("Should count products with a specific name and return number 1", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const count = await repo.count({ name: mockProduct2.select.name });

      assert.equal(count, 1);
    });

    test("Should count number of products based on regex and return number 3 ", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const count = await repo.count({
        name: {
          $regex: /^Product [2-4]$/, // names that start with "Product" and space and number between 2 and 4
          $options: "i",
        },
      });

      assert.equal(count, 3);
    });

    test("Should return 0 if no products match the query", async () => {
      await Product.insertMany([
        mockProduct1.insert,
        mockProduct2.insert,
        mockProduct3.insert,
        mockProduct4.insert,
      ]);

      const count = await repo.count({ name: "RANDOM_NAME" });
      assert.equal(count, 0);
    });

    test("Should return 0 if no products exist", async () => {
      const count = await repo.count({ query: {} });
      assert.equal(count, 0);
    });
  });

  describe("Update Product", () => {
    test("Should find product by id and update it", async () => {
      const created = await Product.create(mockProduct1.insert);

      const updatedProduct = await repo.updateProduct({
        productId: created._id,
        updateData: {
          name: mockProduct2.insert.name,
        },
      });

      assert.ok(updatedProduct);
      assert.equal(updatedProduct.name, mockProduct2.insert.name);
    });

    test("Should return 'null' if product does not exist", async () => {
      const updatedProduct = await repo.updateProduct({
        productId: mockProduct1.select._id,
        updateData: {
          name: mockProduct1.insert.name,
        },
      });

      assert.equal(updatedProduct, null);
    });
  });

  describe("Delete Product", () => {
    test("Should find product by id and delete it", async () => {
      const created = await Product.create(mockProduct1.insert);

      await repo.deleteProduct({
        productId: created._id,
      });

      const product = await Product.findById(created._id);
      assert.equal(product, null);
    });
  });
});
