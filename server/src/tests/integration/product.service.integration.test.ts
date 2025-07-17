import { Types } from "mongoose";
import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";
import { DatabaseValidationError, NotFoundError } from "../../errors";
import { CacheManager } from "../../managers";
import Product from "../../models/productModel";
import { ProductRepository } from "../../repositories";
import { ProductService } from "../../services";
import { mockImageStorage, mockMulterImageFile } from "../mocks";
import {
  generateMockInsertProductWithMulterImage,
  generateMockSelectProduct,
  generateMockSelectProducts,
} from "../mocks/product.mock";
import { connectTestDatabase, disconnectTestDatabase } from "../utils";

suite("Product Service 〖 Integration Tests 〗", async () => {
  let productService: ProductService;
  let productRepository: ProductRepository;
  let cacheManager: CacheManager;
  let imageStorageMock: ReturnType<typeof mockImageStorage>; // Don't have storage for testing

  before(async () => {
    await connectTestDatabase();
    cacheManager = new CacheManager("product");
    productRepository = new ProductRepository(Product, cacheManager);
    imageStorageMock = mockImageStorage();
    productService = new ProductService(productRepository, imageStorageMock);
  });

  after(async () => {
    await Product.deleteMany({});
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    cacheManager.flush();
    imageStorageMock.reset();
  });

  describe("create", () => {
    test("should create and return product when 'repo.create' is called with valid data", async () => {
      // Arrange
      const mockProduct = generateMockInsertProductWithMulterImage();
      const mockImageUrl = "https://example.com/image.jpg";
      imageStorageMock.upload.mock.mockImplementationOnce(
        async () => mockImageUrl,
      );

      // Act
      const createdProduct = await productService.create(mockProduct);

      // Assert
      assert.ok(createdProduct._id, "Product should have an ID");
      assert.equal(createdProduct.name, mockProduct.name);
      assert.equal(createdProduct.brand, mockProduct.brand);
      assert.equal(createdProduct.category, mockProduct.category);
      assert.equal(createdProduct.description, mockProduct.description);
      assert.equal(createdProduct.price, mockProduct.price);
      assert.equal(createdProduct.countInStock, mockProduct.countInStock);
      assert.equal(createdProduct.image, mockImageUrl);
      assert.equal(createdProduct.rating, 0);
      assert.equal(createdProduct.numReviews, 0);
      assert.equal(imageStorageMock.upload.mock.calls.length, 1);
      assert.deepStrictEqual(
        imageStorageMock.upload.mock.calls[0].arguments[0],
        { file: mockProduct.image },
      );
    });

    test("should upload image to storage when 'repo.create' is called with valid image", async () => {
      // Arrange
      const mockProduct = generateMockInsertProductWithMulterImage();
      const mockImageUrl = "https://example.com/image.jpg";
      imageStorageMock.upload.mock.mockImplementationOnce(
        async () => mockImageUrl,
      );

      // Act
      await productService.create(mockProduct);

      // Assert
      assert.equal(imageStorageMock.upload.mock.calls.length, 1);
      assert.deepStrictEqual(
        imageStorageMock.upload.mock.calls[0].arguments[0],
        { file: mockProduct.image },
      );
    });

    test("should throw 'DatabaseValidationError' when 'repo.create' is called with invalid data", async () => {
      // Arrange
      const invalidProduct = {
        ...generateMockInsertProductWithMulterImage(),
        price: "invalid-price" as unknown as number,
      };
      const mockImageUrl = "https://example.com/image.jpg";
      imageStorageMock.upload.mock.mockImplementationOnce(
        async () => mockImageUrl,
      );

      // Act & Assert
      await assert.rejects(
        async () => await productService.create(invalidProduct),
        DatabaseValidationError,
      );
    });

    test("should throw error when 'storage.upload' fails during product creation", async () => {
      // Arrange
      const mockProduct = generateMockInsertProductWithMulterImage();
      const mockError = new Error("Upload failed");
      imageStorageMock.upload.mock.mockImplementationOnce(async () => {
        throw mockError;
      });

      // Act & Assert
      await assert.rejects(
        async () => await productService.create(mockProduct),
        (error: Error) => {
          assert.equal(error, mockError);
          return true;
        },
      );
    });
  });

  describe("getAll", () => {
    test("should return response with products, currentPage and numberOfPages fields", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      await Product.insertMany(mockProducts);
      const keyword = "";
      const currentPage = 1;

      // Act
      const result = await productService.getAll({ keyword, currentPage });

      // Assert
      assert.ok(Array.isArray(result.products));
      assert.equal(typeof result.currentPage, "number");
      assert.equal(typeof result.numberOfPages, "number");
      assert.equal(result.products.length, Math.min(10, mockProducts.length));
    });

    test("should return filtered products when 'repo.getAll' is called with search keyword", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      await Product.insertMany(mockProducts);
      const keyword = mockProducts[0].name.substring(0, 3);
      const currentPage = 1;

      // Act
      const result = await productService.getAll({ keyword, currentPage });

      // Assert
      assert.ok(result.products.length > 0);
      result.products.forEach((product) => {
        assert.ok(product.name.toLowerCase().includes(keyword.toLowerCase()));
      });
    });

    test("should return correct page when 'repo.getAll' is called with specific page number", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 15 }); // Create enough products for multiple pages
      await Product.insertMany(mockProducts);
      const keyword = "";
      const currentPage = 2;

      // Act
      const result = await productService.getAll({ keyword, currentPage });

      // Assert
      assert.equal(result.currentPage, currentPage);
      assert.ok(result.products.length > 0);

      // Get first page to compare
      const firstPageResult = await productService.getAll({
        keyword,
        currentPage: 1,
      });
      const firstPageIds = firstPageResult.products.map((p) =>
        p._id.toString(),
      );
      const secondPageIds = result.products.map((p) => p._id.toString());

      // Ensure no overlap between pages
      const overlap = firstPageIds.some((id) => secondPageIds.includes(id));
      assert.equal(
        overlap,
        false,
        "Pages should not contain overlapping products",
      );
    });

    test("should return empty products array when 'repo.getAll' is called and no products match keyword", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      await Product.insertMany(mockProducts);
      const keyword = "nonexistentproduct";
      const currentPage = 1;

      // Act
      const result = await productService.getAll({ keyword, currentPage });

      // Assert
      assert.equal(result.products.length, 0);
      assert.equal(result.currentPage, currentPage);
      assert.equal(result.numberOfPages, 1);
    });

    test("should return first page when 'repo.getAll' is called without page number", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 });
      await Product.insertMany(mockProducts);
      const keyword = "";
      const currentPage = undefined as unknown as number;

      // Act
      const result = await productService.getAll({ keyword, currentPage });

      // Assert
      assert.equal(result.currentPage, 1);
      assert.ok(result.products.length > 0);
    });

    test("should calculate total number of pages correctly based on products per page", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 25 }); // Create enough products for multiple pages
      await Product.insertMany(mockProducts);
      const keyword = "";
      const currentPage = 1;
      const productsPerPage = 10;

      // Act
      const result = await productService.getAll({ keyword, currentPage });

      // Assert
      const expectedPages = Math.ceil(mockProducts.length / productsPerPage);
      assert.equal(result.numberOfPages, expectedPages);
    });
  });

  describe("getTopRated", () => {
    test("should return top rated products sorted by rating when 'repo.getTopRated' is called", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 5 }).map(
        (product, index) => ({
          ...product,
          rating: 5 - index, // Create descending ratings: 5, 4, 3, 2, 1
        }),
      );
      await Product.insertMany(mockProducts);

      // Act
      const products = await productService.getTopRated();

      // Assert
      assert.ok(products.length > 0);
      for (let i = 1; i < products.length; i++) {
        const prevProduct = await Product.findById(products[i - 1]._id).lean();
        const currentProduct = await Product.findById(products[i]._id).lean();
        assert.ok(
          prevProduct!.rating >= currentProduct!.rating,
          "Products should be sorted by rating in descending order",
        );
      }
    });

    test("should return at most MAX_TOP_RATED_PRODUCTS products when 'repo.getTopRated' is called", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 10 });
      await Product.insertMany(mockProducts);

      // Act
      const products = await productService.getTopRated();

      // Assert
      assert.ok(products.length <= 3); // MAX_TOP_RATED_PRODUCTS is 3
    });

    test("should return only id, name, price and image fields for each product", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act
      const products = await productService.getTopRated();

      // Assert
      products.forEach((product) => {
        const keys = Object.keys(product);
        assert.ok(keys.includes("_id"));
        assert.ok(keys.includes("name"));
        assert.ok(keys.includes("price"));
        assert.ok(keys.includes("image"));
        assert.equal(keys.length, 4);
      });
    });

    test("should return empty array when 'repo.getTopRated' is called and no products exist", async () => {
      // Arrange - database is already empty from beforeEach

      // Act
      const products = await productService.getTopRated();

      // Assert
      assert.equal(products.length, 0);
    });
  });

  describe("getById", () => {
    test("should return product when 'repo.getById' is called with valid ID", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await Product.create(mockProduct);

      // Act
      const product = await productService.getById({
        productId: mockProduct._id,
      });

      // Assert
      assert.ok(product);
      assert.equal(product._id.toString(), mockProduct._id.toString());
      assert.equal(product.name, mockProduct.name);
      assert.equal(product.brand, mockProduct.brand);
      assert.equal(product.category, mockProduct.category);
      assert.equal(product.description, mockProduct.description);
      assert.equal(product.price, mockProduct.price);
      assert.equal(product.countInStock, mockProduct.countInStock);
      assert.equal(product.image, mockProduct.image);
    });

    test("should throw 'NotFoundError' when 'repo.getById' is called with non-existent ID", async () => {
      // Arrange
      const nonExistentId = new Types.ObjectId();

      // Act & Assert
      await assert.rejects(
        async () => await productService.getById({ productId: nonExistentId }),
        NotFoundError,
      );
    });

    test("should throw 'DatabaseValidationError' when 'repo.getById' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () => await productService.getById({ productId: invalidId }),
        DatabaseValidationError,
      );
    });
  });

  describe("update", () => {
    test("should update and persist product when 'repo.update' is called with valid data", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      const updateData = {
        name: "Updated Product Name",
        price: 999,
      };

      // Act
      const updatedProduct = await productService.update({
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
      assert.equal(updatedProduct.image, mockProduct.image);
    });

    test("should keep existing image when 'repo.update' is called without new image", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      const updateData = {
        name: "Updated Product Name",
      };

      // Act
      const updatedProduct = await productService.update({
        productId: mockProduct._id,
        data: updateData,
      });

      // Assert
      assert.equal(updatedProduct.image, mockProduct.image);
      assert.equal(imageStorageMock.replace.mock.calls.length, 0);
    });

    test("should replace old image with new one in storage when updating product image", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await Product.create(mockProduct);
      const newImage = mockMulterImageFile();
      const newImageUrl = "https://example.com/new-image.jpg";
      const updateData = {
        name: "Updated Product Name",
        image: newImage,
      };
      imageStorageMock.replace.mock.mockImplementationOnce(
        async () => newImageUrl,
      );

      // Act
      const updatedProduct = await productService.update({
        productId: mockProduct._id,
        data: updateData,
      });

      // Assert
      assert.equal(updatedProduct.image, newImageUrl);
      assert.equal(imageStorageMock.replace.mock.calls.length, 1);
      assert.deepStrictEqual(
        imageStorageMock.replace.mock.calls[0].arguments[0],
        { url: mockProduct.image, file: newImage },
      );
    });

    test("should throw 'NotFoundError' when 'repo.update' is called with non-existent ID", async () => {
      // Arrange
      const nonExistentId = new Types.ObjectId();
      const updateData = { name: "Updated Product Name" };

      // Act & Assert
      await assert.rejects(
        async () =>
          await productService.update({
            productId: nonExistentId,
            data: updateData,
          }),
        NotFoundError,
      );
    });

    test("should throw 'DatabaseValidationError' when 'repo.update' is called with invalid data", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await Product.create(mockProduct);
      const invalidData = { price: "invalid-price" as unknown as number };

      // Act & Assert
      await assert.rejects(
        async () =>
          await productService.update({
            productId: mockProduct._id,
            data: invalidData,
          }),
        DatabaseValidationError,
      );
    });

    test("should throw error when 'storage.replace' fails during product update", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await Product.create(mockProduct);
      const mockError = new Error("Replace failed");
      const updateData = {
        name: "Updated Product Name",
        image: mockMulterImageFile(),
      };
      imageStorageMock.replace.mock.mockImplementationOnce(async () => {
        throw mockError;
      });

      // Act & Assert
      await assert.rejects(
        async () =>
          await productService.update({
            productId: mockProduct._id,
            data: updateData,
          }),
        (error: Error) => {
          assert.equal(error, mockError);
          return true;
        },
      );
    });
  });

  describe("delete", () => {
    test("should delete product when 'repo.delete' is called with valid ID", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      imageStorageMock.delete.mock.mockImplementationOnce(async () => {});

      // Act
      await productService.delete({ productId: mockProduct._id });

      // Assert
      const deletedProduct = await Product.findById(mockProduct._id);
      assert.strictEqual(deletedProduct, null);
      assert.equal(imageStorageMock.delete.mock.calls.length, 1);
      assert.deepStrictEqual(
        imageStorageMock.delete.mock.calls[0].arguments[0],
        { url: mockProduct.image },
      );
    });

    test("should verify image is actually deleted from storage", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      let imageDeleted = false;
      imageStorageMock.delete.mock.mockImplementationOnce(async () => {
        imageDeleted = true;
      });

      // Act
      await productService.delete({ productId: mockProduct._id });

      // Assert
      assert.equal(imageDeleted, true);
      assert.equal(imageStorageMock.delete.mock.calls.length, 1);
    });

    test("should handle case where storage deletion fails but product was deleted", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      const mockError = new Error("Delete failed");
      imageStorageMock.delete.mock.mockImplementationOnce(async () => {
        throw mockError;
      });

      // Act & Assert
      await assert.rejects(
        async () => await productService.delete({ productId: mockProduct._id }),
        (error: Error) => {
          assert.equal(error, mockError);
          return true;
        },
      );

      // Verify product was still deleted from database
      const deletedProduct = await Product.findById(mockProduct._id);
      assert.strictEqual(deletedProduct, null);
    });

    test("should throw 'NotFoundError' when 'repo.delete' is called with non-existent ID", async () => {
      // Arrange
      const nonExistentId = new Types.ObjectId();

      // Act & Assert
      await assert.rejects(
        async () => await productService.delete({ productId: nonExistentId }),
        NotFoundError,
      );
    });

    test("should throw 'DatabaseValidationError' when 'repo.delete' is called with invalid ObjectId", async () => {
      // Arrange
      const invalidId = "invalid-id" as unknown as Types.ObjectId;

      // Act & Assert
      await assert.rejects(
        async () => await productService.delete({ productId: invalidId }),
        DatabaseValidationError,
      );
    });

    test("should throw error when 'storage.delete' fails during product deletion", async () => {
      // Arrange
      const mockProduct = generateMockSelectProduct();
      await productRepository.create(mockProduct);
      const mockError = new Error("Delete failed");
      imageStorageMock.delete.mock.mockImplementationOnce(async () => {
        throw mockError;
      });

      // Act & Assert
      await assert.rejects(
        async () => await productService.delete({ productId: mockProduct._id }),
        mockError,
      );
    });
  });
});
