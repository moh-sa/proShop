import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import Product from "../../models/productModel";
import User from "../../models/userModel";
import { productRepository } from "../../repositories/product.repository";
import {
  generateMockObjectId,
  generateMockProduct,
  generateMockProducts,
  generateMockUsers,
} from "../mocks";
import { dbClose, dbConnect } from "../utils";

const repo = productRepository;
const mockUsers = generateMockUsers(4);

before(async () => {
  await dbConnect();
  await User.insertMany(mockUsers);
});

beforeEach(async () => {
  repo._invalidateCache();
  await Product.deleteMany({});
});

after(async () => await dbClose());

suite("Product Repository", () => {
  describe("Create Product", () => {
    test("Should create new product in the database", async () => {
      const mockProduct = generateMockProduct();

      const product = await repo.createProduct({
        productData: mockProduct,
      });

      assert.ok(product);

      assert.equal(product.name, mockProduct.name);
      assert.equal(product.description, mockProduct.description);
    });
  });

  describe("Retrieve Product By Id", () => {
    test("Should retrieve a product by id", async () => {
      const mockProduct = generateMockProduct();

      const created = await Product.create(mockProduct);

      const product = await repo.getProductById({ productId: created._id });
      assert.ok(product);
      assert.equal(product.name, created.name);
    });

    test("Should return null if product does not exist", async () => {
      const product = await repo.getProductById({
        productId: generateMockObjectId(),
      });
      assert.equal(product, null);
    });
  });

  describe("Retrieve Top Products", () => {
    test("Should retrieve 3 top rated products", async () => {
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      const products = await repo.getTopRatedProducts({ limit: 3 });
      assert.ok(products);
      assert.equal(products.length, 3);

      const topRatedProduct = mockProducts.reduce((highest, product) => {
        return product.rating > highest.rating ? product : highest;
      });
      assert.equal(products[0].name, topRatedProduct.name);
    });

    test("Should return an empty array if no products exist", async () => {
      const products = await repo.getTopRatedProducts({ limit: 3 });

      assert.ok(products);
      assert.equal(products.length, 0);
    });
  });

  describe("Retrieve Products", () => {
    test("Should retrieve all products on one page", async () => {
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      const products = await repo.getAllProducts({
        query: {},
        currentPage: 1,
        numberOfProductsPerPage: 4,
      });

      assert.ok(products);
      assert.equal(products.length, 4);
    });

    test("Should retrieve all products on 2 pages", async () => {
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      const firstPage = await repo.getAllProducts({
        query: {},
        currentPage: 1,
        numberOfProductsPerPage: 2,
      });

      assert.ok(firstPage);
      assert.equal(firstPage.length, 2);

      const secondPage = await repo.getAllProducts({
        query: {},
        currentPage: 2,
        numberOfProductsPerPage: 2,
      });

      assert.ok(secondPage);
      assert.equal(secondPage.length, 2);
    });

    test("Should retrieve the correct number of products when the number of products per page is greater than the total number of products", async () => {
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

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
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      const products = await repo.getAllProducts({
        query: { name: mockProducts[0].name },
        currentPage: 1,
        numberOfProductsPerPage: 10,
      });

      assert.ok(products);
      assert.equal(products.length, 1);
      assert.equal(products[0].name, mockProducts[0].name);
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
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      const count = await repo.count({ query: {} });
      assert.equal(count, 4);
    });

    test("Should count products with a specific name and return number 1", async () => {
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

      const count = await repo.count({ name: mockProducts[0].name });

      assert.equal(count, 1);
    });

    test("Should return 0 if no products match the query", async () => {
      const mockProducts = generateMockProducts(4);

      await Product.insertMany(mockProducts);

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
      const [mockProduct1, mockProduct2] = generateMockProducts(2);

      const created = await Product.create(mockProduct1);

      const updatedProduct = await repo.updateProduct({
        productId: created._id,
        updateData: {
          name: mockProduct2.name,
        },
      });

      assert.ok(updatedProduct);
      assert.equal(updatedProduct.name, mockProduct2.name);
    });

    test("Should return 'null' if product does not exist", async () => {
      const mockProduct = generateMockProduct();

      const updatedProduct = await repo.updateProduct({
        productId: mockProduct._id,
        updateData: {
          name: mockProduct.name,
        },
      });

      assert.equal(updatedProduct, null);
    });
  });

  describe("Delete Product", () => {
    test("Should find product by id and delete it", async () => {
      const mockProduct = generateMockProduct();

      const created = await Product.create(mockProduct);

      await repo.deleteProduct({
        productId: created._id,
      });

      const product = await Product.findById(created._id);
      assert.equal(product, null);
    });
  });
});
