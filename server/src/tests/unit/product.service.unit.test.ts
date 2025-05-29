import assert from "node:assert/strict";
import test, { beforeEach, describe, suite } from "node:test";
import { DatabaseError, NotFoundError } from "../../errors";
import { ProductService } from "../../services";
import {
  generateMockInsertProductWithMulterImage,
  generateMockSelectProduct,
  generateMockSelectProducts,
  mockImageStorage,
  mockMulterImageFile,
  mockProductRepository,
} from "../mocks";

suite("Product Service 〖 Unit Tests 〗", () => {
  const mockRepo = mockProductRepository();
  const mockStorage = mockImageStorage();

  const service = new ProductService(mockRepo, mockStorage);

  beforeEach(() => {
    mockRepo.reset();
    mockStorage.reset();
  });

  describe("create", () => {
    const mockInsertProduct = generateMockInsertProductWithMulterImage();
    const mockSelectProduct = generateMockSelectProduct();
    const expectedResult = {
      ...mockInsertProduct,
      _id: mockSelectProduct._id,
      image: mockSelectProduct.image,
      rating: mockSelectProduct.rating,
      numReviews: mockSelectProduct.numReviews,
      createdAt: mockSelectProduct.createdAt,
      updatedAt: mockSelectProduct.updatedAt,
    };

    test("Should return product object when 'repo.create' is called once with product data", async () => {
      mockStorage.upload.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult.image),
      );

      mockRepo.create.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const result = await service.create(mockInsertProduct);

      assert.ok(result);
      assert.deepEqual(result, expectedResult);

      assert.strictEqual(mockRepo.create.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.create.mock.calls[0].arguments[0], {
        ...mockInsertProduct,
        image: expectedResult.image,
      });
    });

    test("Should return a string when 'storage.upload' is called once with 'data.file'", async () => {
      mockStorage.upload.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult.image),
      );

      mockRepo.create.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      await service.create(mockInsertProduct);

      assert.strictEqual(mockStorage.upload.mock.callCount(), 1);
      assert.deepStrictEqual(mockStorage.upload.mock.calls[0].arguments[0], {
        file: mockInsertProduct.image,
      });
      assert.strictEqual(
        await mockStorage.upload.mock.calls[0].result,
        expectedResult.image,
      );
    });

    test("Should throw generic 'Error' if 'storage.upload' rejects", async () => {
      const mockError = new Error("Upload failed");

      mockStorage.upload.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        () => service.create(mockInsertProduct),
        (error: Error) => {
          assert.ok(error instanceof Error);
          assert.strictEqual(error.message, mockError.message);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.create' rejects", async () => {
      const mockError = new DatabaseError();

      mockStorage.upload.mock.mockImplementationOnce(() => Promise.resolve(""));

      mockRepo.create.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        () => service.create(mockInsertProduct),
        DatabaseError,
      );
    });
  });

  describe("getAll", () => {
    const mockCount = 4;
    const expectedResult = generateMockSelectProducts({ count: 4 });

    function createRegexQuery(keyword: string) {
      return { name: { $regex: keyword, $options: "i" } };
    }

    test("Should return array of products when both 'repo.count' and 'repo.getAll' are called once with no args", async () => {
      mockRepo.count.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      mockRepo.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const result = await service.getAll({ keyword: "", currentPage: 1 });

      assert.ok(result);
      assert.strictEqual(result.products.length, expectedResult.length);
      assert.deepStrictEqual(result.products, expectedResult);

      assert.strictEqual(mockRepo.count.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.count.mock.calls[0].arguments[0], {});

      assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0], {
        query: {},
        currentPage: 1,
        numberOfProductsPerPage: 10,
      });
    });

    test("Should return array of products when both 'repo.count' and 'repo.getAll' are called once with 'keyword''", async () => {
      mockRepo.count.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      mockRepo.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const inputData = { keyword: "test", currentPage: 1 };
      const result = await service.getAll(inputData);

      assert.ok(result);
      assert.strictEqual(result.products.length, expectedResult.length);
      assert.deepStrictEqual(result.products, expectedResult);

      assert.strictEqual(mockRepo.count.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockRepo.count.mock.calls[0].arguments[0],
        createRegexQuery(inputData.keyword),
      );

      assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0], {
        query: createRegexQuery(inputData.keyword),
        currentPage: 1,
        numberOfProductsPerPage: 10,
      });
    });

    test("Should return array of products when both 'repo.count' and 'repo.getAll' are called once with 'currentPage'", async () => {
      mockRepo.count.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );
      mockRepo.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const result = await service.getAll({ keyword: "", currentPage: 2 });

      assert.ok(result);
      assert.strictEqual(result.products.length, expectedResult.length);
      assert.deepStrictEqual(result.products, expectedResult);

      assert.strictEqual(mockRepo.count.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.count.mock.calls[0].arguments[0], {});

      assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0], {
        query: {},
        currentPage: 2,
        numberOfProductsPerPage: 10,
      });
    });

    test("Should throw 'DatabaseError' if 'repo.count' rejects", async () => {
      const mockError = new DatabaseError("Count failed");

      mockRepo.count.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        () => service.getAll({ keyword: "", currentPage: 1 }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mockError.message);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.getAll' rejects", async () => {
      const mockError = new DatabaseError("Retrieve failed");

      mockRepo.count.mock.mockImplementationOnce(() =>
        Promise.resolve(mockCount),
      );

      mockRepo.getAll.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        () => service.getAll({ keyword: "", currentPage: 1 }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mockError.message);
          return true;
        },
      );
    });
  });

  describe("getTopRated", () => {
    const expectedResult = generateMockSelectProducts({ count: 3 });

    test("Should return array of products when 'repo.getTopRated' is called once with no args", async () => {
      mockRepo.getTopRated.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const result = await service.getTopRated();

      assert.ok(result);
      assert.strictEqual(result.length, expectedResult.length);
      assert.deepStrictEqual(result, expectedResult);

      assert.strictEqual(mockRepo.getTopRated.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockRepo.getTopRated.mock.calls[0].arguments[0],
        {},
      );
    });

    test("Should throw 'DatabaseError' if 'repo.getTopRated' rejects", async () => {
      const mockError = new DatabaseError("Retrieve failed");

      mockRepo.getTopRated.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        () => service.getTopRated(),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mockError.message);
          return true;
        },
      );
    });
  });

  describe("getById", () => {
    const expectedResult = generateMockSelectProduct();
    const productId = expectedResult._id;

    test("Should return product object when 'repo.getById' is called once with 'productId'", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const result = await service.getById({ productId });

      assert.ok(result);
      assert.deepStrictEqual(result, expectedResult);

      assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
        productId,
      });
    });

    test("Should throw 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        () => service.getById({ productId }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Product not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.getById' rejects", async () => {
      const mockError = new DatabaseError("Retrieve failed");

      mockRepo.getById.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        () => service.getById({ productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mockError.message);
          return true;
        },
      );
    });
  });

  describe("update", () => {
    const mockProduct = generateMockSelectProduct();
    const productId = mockProduct._id;

    test("Should return product object when 'repo.update' is called once with 'productId' and 'data'", async () => {
      const mockUpdateData = { name: "UPDATED NAME" };
      const expectedResult = { ...mockProduct, ...mockUpdateData };

      mockRepo.update.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const result = await service.update({
        productId,
        data: mockUpdateData,
      });

      assert.ok(result);
      assert.deepStrictEqual(result, expectedResult);

      assert.strictEqual(mockRepo.update.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.update.mock.calls[0].arguments[0], {
        productId,
        data: mockUpdateData,
      });

      // Ensure that 'repo.getById' wasn't called
      assert.strictEqual(mockRepo.getById.mock.callCount(), 0);
    });

    test("Should return product object when 'repo.getById' is called once with 'productId', and 'storage.replace' is called once with 'url' and 'file'", async () => {
      const mockUpdateData = { image: mockMulterImageFile() };

      mockRepo.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockProduct),
      );

      mockStorage.replace.mock.mockImplementationOnce(() =>
        Promise.resolve(mockProduct.image),
      );

      mockRepo.update.mock.mockImplementationOnce(() =>
        Promise.resolve(mockProduct),
      );

      const result = await service.update({
        productId,
        data: mockUpdateData,
      });

      assert.ok(result);
      assert.deepStrictEqual(result, mockProduct);

      assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
        productId,
      });

      assert.strictEqual(mockStorage.replace.mock.callCount(), 1);
      assert.deepStrictEqual(mockStorage.replace.mock.calls[0].arguments[0], {
        url: mockProduct.image,
        file: mockUpdateData.image,
      });

      assert.strictEqual(mockRepo.update.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.update.mock.calls[0].arguments[0], {
        productId,
        data: { image: mockProduct.image },
      });
    });

    test("Should throw 'NotFoundError' if 'repo.update' returns 'null'", async () => {
      const mockUpdateData = { name: "UPDATED NAME" };

      mockRepo.update.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        () => service.update({ productId, data: mockUpdateData }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Product not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.update' rejects", async () => {
      const mockUpdateData = { name: "UPDATED NAME" };
      const mockError = new DatabaseError("Update failed");

      mockRepo.update.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        () => service.update({ productId, data: mockUpdateData }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mockError.message);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.getById' rejects", async () => {
      const mockUpdateData = { image: mockMulterImageFile() };
      const mockError = new DatabaseError("Retrieve failed");

      mockRepo.getById.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        async () => await service.update({ productId, data: mockUpdateData }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mockError.message);
          return true;
        },
      );
    });
  });

  describe("delete", () => {
    const expectedResult = generateMockSelectProduct();
    const productId = expectedResult._id;

    test("Should return 'undefined' when 'repo.delete' is called once with 'productId'", async () => {
      mockRepo.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(expectedResult),
      );

      const result = await service.delete({ productId });

      assert.strictEqual(result, undefined);

      assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.delete.mock.calls[0].arguments[0], {
        productId,
      });
    });

    test("Should throw 'NotFoundError' if 'repo.delete' returns 'null'", async () => {
      mockRepo.delete.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        async () => await service.delete({ productId }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "Product not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });

    test("Should throw 'DatabaseError' if 'repo.delete' rejects", async () => {
      const mockError = new DatabaseError("Delete failed");

      mockRepo.delete.mock.mockImplementationOnce(() =>
        Promise.reject(mockError),
      );

      await assert.rejects(
        async () => await service.delete({ productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mockError.message);
          return true;
        },
      );
    });
  });
});
