import { Types } from "mongoose";
import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { DatabaseValidationError } from "../../errors/database";
import { CacheManager } from "../../managers";
import Product from "../../models/productModel";
import { ProductRepository } from "../../repositories";
import { SelectProduct, TopRatedProduct } from "../../types";
import { removeObjectFields } from "../../utils";
import { generateMockObjectId } from "../mocks";
import {
  generateMockInsertProductWithStringImage,
  generateMockSelectProduct,
  generateMockSelectProducts,
} from "../mocks/product.mock";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("Product Repository 〖 Integration Tests 〗", async () => {
  let productRepository: ProductRepository;
  let cacheManager: CacheManager;

  before(async () => {
    await connectTestDatabase();
    cacheManager = new CacheManager("product");
    productRepository = new ProductRepository(Product, cacheManager);
  });

  after(async () => {
    await Product.deleteMany({});
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    cacheManager.flush();
  });

  describe("create", () => {
    test("should create a product when 'db.create' is called with valid product data", async () => {
      // Arrange
      const mockProduct = generateMockInsertProductWithStringImage();

      // Act
      const createdProduct = await productRepository.create(mockProduct);

      // Assert
      assert.ok(createdProduct._id, "Product should have an ID");
      assert.equal(createdProduct.name, mockProduct.name);
      assert.equal(createdProduct.brand, mockProduct.brand);
      assert.equal(createdProduct.category, mockProduct.category);
      assert.equal(createdProduct.description, mockProduct.description);
      assert.equal(createdProduct.price, mockProduct.price);
      assert.equal(createdProduct.countInStock, mockProduct.countInStock);
      assert.equal(createdProduct.image, mockProduct.image);
      assert.equal(createdProduct.rating, 0);
      assert.equal(createdProduct.numReviews, 0);
    });

    test("should cache the created product when 'db.create' is called with valid data", async () => {
      // Arrange
      const mockProduct = generateMockInsertProductWithStringImage();

      // Act
      const createdProduct = await productRepository.create(mockProduct);
      const cachedProduct = cacheManager.get<SelectProduct>({
        key: createdProduct._id.toString(),
      });

      // Assert
      assert.ok(cachedProduct.success);
      // IDs does not have the same reference
      const { _id: createdProductId, ...assertProduct } = createdProduct;
      const { _id: cachedProductId, ...assertCached } = cachedProduct.data;
      assert.deepStrictEqual(
        createdProductId.toString(),
        cachedProductId.toString(),
      );
      assert.deepStrictEqual(assertProduct, assertCached);
    });

    test("should throw 'DatabaseValidationError' when 'db.create' is called with invalid data", async () => {
      // Arrange
      const invalidProduct = {
        ...generateMockInsertProductWithStringImage(),
        price: "invalid-price" as unknown as number,
      };

      // Act & Assert
      await assert.rejects(
        async () => await productRepository.create(invalidProduct),
        DatabaseValidationError,
      );
    });
  });

  describe("getAll", () => {
    test("should return cached products when 'db.find' is called with page that exists in cache", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Promise.all(
        mockProducts.map(
          async (product) => await productRepository.create(product),
        ),
      );

      // Act
      const products = await productRepository.getAll({
        query: {},
        numberOfProductsPerPage: 10,
        currentPage: 1,
      });

      // Assert
      assert.ok(Array.isArray(products));
      assert.ok(products.length > 0);
      assert.strictEqual(products.length, mockProducts.length);
      products.forEach((product, index) => {
        const { _id: mockProductId, ...assertMockProduct } = removeObjectFields(
          mockProducts[index],
          ["user", "countInStock", "createdAt", "updatedAt", "description"],
        );
        const { _id: productId, ...assertProduct } = product;
        assert.strictEqual(mockProductId.toString(), productId.toString());
        assert.deepStrictEqual(assertMockProduct, assertProduct);
      });
    });

    test("should return correct number of products per page when 'db.find' is called", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      await Product.insertMany(mockProducts);
      const productsPerPage = 2;

      // Act
      const products = await productRepository.getAll({
        query: {},
        numberOfProductsPerPage: productsPerPage,
        currentPage: 1,
      });

      // Assert
      assert.equal(products.length, productsPerPage);
    });

    test("should return correct page of products when 'db.find' is called with specific page", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      await Product.insertMany(mockProducts);
      const productsPerPage = 2;
      const page = 2;

      // Act
      const products = await productRepository.getAll({
        query: {},
        numberOfProductsPerPage: productsPerPage,
        currentPage: page,
      });

      // Assert
      assert.equal(products.length, productsPerPage);
      // Verify we got different products than first page
      const firstPageProducts = await productRepository.getAll({
        query: {},
        numberOfProductsPerPage: productsPerPage,
        currentPage: 1,
      });
      assert.notDeepStrictEqual(products[0]._id, firstPageProducts[0]._id);
    });

    test("should return filtered products when 'getAll' is called with query filters", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      const targetBrand = mockProducts[0].brand;
      await Product.insertMany(mockProducts);

      // Act
      const products = await productRepository.getAll({
        query: { brand: targetBrand },
        numberOfProductsPerPage: 10,
        currentPage: 1,
      });

      // Assert
      assert.ok(products.length > 0);
      products.forEach((product) => {
        assert.equal(product.brand, targetBrand);
      });
    });

    test("should return empty array when 'getAll' is called and no products match criteria", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act
      const products = await productRepository.getAll({
        query: { brand: "Non-existent Brand" },
        numberOfProductsPerPage: 10,
        currentPage: 1,
      });

      // Assert
      assert.equal(products.length, 0);
    });
  });

  describe("getTopRated", () => {
    test("should return cached products when 'db.getTopRated' is called and cache exists", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Promise.all(
        mockProducts.map(
          async (product) => await productRepository.create(product),
        ),
      );

      // Act
      const products = await productRepository.getTopRated({ limit: 3 });

      // Assert
      assert.ok(Array.isArray(products));
      assert.strictEqual(products.length, mockProducts.length);
      const mockProductsIds = mockProducts.map((product) =>
        product._id.toString(),
      );
      products.forEach((product) => {
        assert.ok(mockProductsIds.includes(product._id.toString()));
      });
    });

    test("should return and cache products when 'db.getTopRated' is called and cache doesn't exist", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act & Assert
      const noProductsCached = cacheManager.get({ key: "top-rated" });
      assert.strictEqual(noProductsCached.success, false);

      const products = await productRepository.getTopRated({ limit: 3 });
      assert.ok(products);
      assert.ok(Array.isArray(products));
      assert.equal(products.length, mockProducts.length);

      const cachedProducts = cacheManager.get<Array<TopRatedProduct>>({
        key: "top-rated",
      });
      assert.ok(cachedProducts.success);
      assert.strictEqual(cachedProducts.data.length, mockProducts.length);
    });

    test("should return correct number of products when 'db.getTopRated' is called with limit", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      await Product.insertMany(mockProducts);
      const limit = 2;

      // Act
      const products = await productRepository.getTopRated({ limit });

      // Assert
      assert.equal(products.length, limit);
    });

    test("should return products sorted by rating when 'db.getTopRated' is called", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 }).map(
        (product, index) => ({
          ...product,
          rating: 5 - index, // Create descending ratings: 5, 4, 3
        }),
      );
      await Product.insertMany(mockProducts);

      // Act
      const products = await productRepository.getTopRated({ limit: 3 });

      // Assert
      assert.equal(products.length, 3);
      for (let i = 1; i < products.length; i++) {
        const prevProduct = await Product.findById(products[i - 1]._id).lean();
        const currentProduct = await Product.findById(products[i]._id).lean();
        assert.ok(
          prevProduct!.rating >= currentProduct!.rating,
          "Products should be sorted by rating in descending order",
        );
      }
    });

    test("should return empty array when 'db.getTopRated' is called and no products exist", async () => {
      // Arrange - no products in database

      // Act
      const products = await productRepository.getTopRated({ limit: 3 });

      // Assert
      assert.equal(products.length, 0);
    });
  });

  describe("getById", () => {
    test("should return cached product when 'db.findById' is called with an ID that exists in cache", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);

      // Act
      const product = await productRepository.getById({
        productId: mockProduct._id,
      });

      // Assert
      assert.ok(product);
      assert.strictEqual(product.name, mockProduct.name);
      assert.strictEqual(product.brand, mockProduct.brand);
      assert.strictEqual(product.category, mockProduct.category);
      assert.strictEqual(product.description, mockProduct.description);
      assert.strictEqual(product.price, mockProduct.price);
      assert.strictEqual(product.countInStock, mockProduct.countInStock);
      assert.strictEqual(product.image, mockProduct.image);
      assert.strictEqual(product.rating, mockProduct.rating);
      assert.strictEqual(product.numReviews, mockProduct.numReviews);
    });

    test("should return product and cache it when 'db.findById' is called with valid ID not in cache", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await Product.create(mockProduct);

      // Act & Assert
      const noProductCached = cacheManager.get({
        key: mockProduct._id.toString(),
      });
      assert.strictEqual(noProductCached.success, false);

      await productRepository.getById({
        productId: mockProduct._id,
      });

      const cachedProduct = cacheManager.get<SelectProduct>({
        key: mockProduct._id.toString(),
      });
      assert.ok(cachedProduct.success);
      assert.strictEqual(cachedProduct.data.name, mockProduct.name);
    });

    test("should return null when 'db.findById' is called with non-existent ID", async () => {
      // Arrange
      const nonExistentId = new Types.ObjectId();

      // Act
      const product = await productRepository.getById({
        productId: nonExistentId,
      });

      // Assert
      assert.strictEqual(product, null);
    });

    test("should throw 'DatabaseValidationError' when 'db.findById' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () => await productRepository.getById({ productId: invalidId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseValidationError);
          return true;
        },
      );
    });
  });

  describe("update", () => {
    test("should update and return product when 'db.update' is called with valid ID and data", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      const updateData = {
        name: "Updated Product Name",
        price: 999,
      };

      // Act
      const updatedProduct = await productRepository.update({
        productId: mockProduct._id,
        data: updateData,
      });

      // Assert
      assert.ok(updatedProduct);
      assert.equal(updatedProduct.name, updateData.name);
      assert.equal(updatedProduct.price, updateData.price);
      // Verify other fields remain unchanged
      assert.equal(updatedProduct.brand, mockProduct.brand);
      assert.equal(updatedProduct.category, mockProduct.category);
    });

    test("should invalidate product cache when 'db.update' is called successfully", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      const cacheKey = mockProduct._id.toString();

      const updateData = { name: "Updated Product Name" };

      // Act
      await productRepository.update({
        productId: mockProduct._id,
        data: updateData,
      });

      // Assert
      const cachedProduct = cacheManager.get<SelectProduct>({
        key: cacheKey,
      });
      assert.strictEqual(cachedProduct.success, false);
    });

    test("should return null when 'db.update' is called with non-existent ID", async () => {
      // Arrange
      const nonExistentId = new Types.ObjectId();
      const updateData = { name: "Updated Product Name" };

      // Act
      const updatedProduct = await productRepository.update({
        productId: nonExistentId,
        data: updateData,
      });

      // Assert
      assert.strictEqual(updatedProduct, null);
    });

    test("should throw DatabaseValidationError when 'db.update' is called with invalid data", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await Product.create(mockProduct);
      const invalidData = { price: "invalid-price" as unknown as number };

      // Act & Assert
      await assert.rejects(
        async () =>
          await productRepository.update({
            productId: mockProduct._id,
            data: invalidData,
          }),
        DatabaseValidationError,
      );
    });

    test("should throw DatabaseValidationError when 'update' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;
      const updateData = { name: "Updated Product Name" };

      // Act & Assert
      await assert.rejects(
        async () =>
          await productRepository.update({
            productId: invalidId,
            data: updateData,
          }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseValidationError);
          return true;
        },
      );
    });
  });

  describe("delete", () => {
    test("should delete and return product when 'db.delete' is called with valid ID", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);

      // Act
      const deletedProduct = await productRepository.delete({
        productId: mockProduct._id,
      });

      // Assert
      assert.ok(deletedProduct);
      assert.equal(deletedProduct.name, mockProduct.name);
      assert.equal(deletedProduct.description, mockProduct.description);
      assert.equal(deletedProduct.brand, mockProduct.brand);
      assert.equal(deletedProduct.category, mockProduct.category);
      assert.equal(deletedProduct.price, mockProduct.price);
      assert.equal(deletedProduct.countInStock, mockProduct.countInStock);
      assert.equal(deletedProduct.image, mockProduct.image);
      assert.equal(deletedProduct.rating, mockProduct.rating);
      assert.equal(deletedProduct.numReviews, mockProduct.numReviews);
      const productInDb = await Product.findById(mockProduct._id).lean();
      assert.strictEqual(productInDb, null);
    });

    test("should invalidate product cache when 'db.delete' is called successfully", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      const cacheKey = mockProduct._id.toString();

      // Act
      await productRepository.delete({ productId: mockProduct._id });

      // Assert
      const cachedProduct = cacheManager.get<SelectProduct>({
        key: cacheKey,
      });
      assert.strictEqual(cachedProduct.success, false);
    });

    test(
      "should invalidate top-rated cache when 'db.delete' is called successfully",
      { todo: true },
    );

    test("should return null when 'db.delete' is called with non-existent ID", async () => {
      // Arrange
      const nonExistentId = generateMockObjectId();

      // Act
      const deletedProduct = await productRepository.delete({
        productId: nonExistentId,
      });

      // Assert
      assert.strictEqual(deletedProduct, null);
    });

    test("should throw DatabaseValidationError when 'delete' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () => await productRepository.delete({ productId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("count", () => {
    test("should return total count when 'db.count' is called without query", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act
      const count = await productRepository.count({});

      // Assert
      assert.equal(count, mockProducts.length);
    });

    test("should return filtered count when 'db.count' is called with query filters", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      const targetBrand = mockProducts[0].brand;
      const productsWithTargetBrand = mockProducts.filter(
        (p) => p.brand === targetBrand,
      );
      await Product.insertMany(mockProducts);

      // Act
      const count = await productRepository.count({ brand: targetBrand });

      // Assert
      assert.equal(count, productsWithTargetBrand.length);
    });

    test("should return 0 when 'db.count' is called and no products match criteria", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act
      const count = await productRepository.count({
        brand: "Non-existent Brand",
      });

      // Assert
      assert.equal(count, 0);
    });
  });
});
