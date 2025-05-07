import assert from "node:assert";
import test, { afterEach, mock } from "node:test";
import { CacheManager } from "../../managers";
import Product from "../../models/productModel";
import { ProductRepository } from "../../repositories";
import { InsertProductWithStringImage, SelectProduct } from "../../types";
import {
  generateMockInsertProductWithStringImage,
  generateMockSelectProduct,
} from "../mocks";

const mockProductModel = {
  create: mock.fn(
    async (
      data: InsertProductWithStringImage,
    ): Promise<{ toObject: () => SelectProduct }> => {
      const mockProduct = {
        ...generateMockSelectProduct(),
        ...data,
      };
      return {
        toObject: () => mockProduct,
      };
    },
  ),
};

const mockCacheManager = {
  generateKey: mock.fn((args: { id: string }) => `product:${args.id}`),
  set: mock.fn((_: { key: string; value: string; ttl?: number }) => true),
};

afterEach(() => {
  mock.restoreAll();
});

test("ProductRepository - create - successful product creation", async () => {
  const productRepository = new ProductRepository(
    mockProductModel as unknown as typeof Product,
    mockCacheManager as unknown as CacheManager,
  );

  const inputData = generateMockInsertProductWithStringImage();

  const createdProduct = await productRepository.create(inputData);

  assert.ok(createdProduct);
  assert.ok(createdProduct._id);
  assert.ok(createdProduct.createdAt);
  assert.ok(createdProduct.updatedAt);
  assert.strictEqual(createdProduct.rating, 0);
  assert.strictEqual(createdProduct.numReviews, 0);

  assert.strictEqual(createdProduct.name, inputData.name);
  assert.strictEqual(createdProduct.image, inputData.image);

  assert.strictEqual(mockProductModel.create.mock.callCount(), 1);
  assert.deepStrictEqual(
    mockProductModel.create.mock.calls[0].arguments[0],
    inputData,
  );

  assert.strictEqual(mockCacheManager.generateKey.mock.callCount(), 1);
  assert.deepStrictEqual(
    mockCacheManager.generateKey.mock.calls[0].arguments[0],
    { id: createdProduct._id.toString() },
  );

  assert.strictEqual(mockCacheManager.set.mock.callCount(), 1);
  mockCacheManager.set.mock.calls[0].arguments[0];
  assert.deepStrictEqual(mockCacheManager.set.mock.calls[0].arguments[0], {
    key: `product:${createdProduct._id.toString()}`,
    value: createdProduct,
  });
});
