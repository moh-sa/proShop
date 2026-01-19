import assert from "node:assert";
import { after, before, beforeEach, describe, it, suite } from "node:test";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../constants/index.js";
import Product from "../../models/product.model.js";
import { Paginator } from "../../utils/index.js";
import { generateMockSelectProducts } from "../mocks/index.js";
import { connectTestDatabase, disconnectTestDatabase } from "../utils/index.js";

suite("Paginator 〖 Integration Tests 〗", async () => {
	const paginator = new Paginator(Product);

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	beforeEach(async () => await Product.deleteMany({}));

	describe("page size", () => {
		it("should use default page size when size is undefined", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 15 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 1 });

			// Assert
			assert.strictEqual(result.meta.pageSize, DEFAULT_PAGE_SIZE);
		});

		it("should clamp page size to MAX_PAGE_SIZE", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: MAX_PAGE_SIZE + 5 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: MAX_PAGE_SIZE + 1000,
			});

			// Assert
			assert.strictEqual(result.meta.pageSize, MAX_PAGE_SIZE);
		});

		it("should clamp page size minimum to 1", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 15 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 1, pageSize: 0 });

			// Assert
			assert.strictEqual(result.meta.pageSize, 1);
		});

		it("should floor non-integer page size", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: 3.7,
			});

			// Assert
			assert.strictEqual(result.meta.pageSize, 3);
		});

		it("should clamp negative page size to 1", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 15 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 1, pageSize: -3 });

			// Assert
			assert.strictEqual(result.meta.pageSize, 1);
		});
	});

	describe("page number", () => {
		it("should floor non-integer page number", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 2.9,
				pageSize: 2,
			});

			// Assert
			assert.strictEqual(result.meta.currentPage, 2);
		});

		it("should clamp page number below 1 to 1", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 0, pageSize: 5 });

			// Assert
			assert.strictEqual(result.meta.currentPage, 1);
		});

		it("should clamp negative page number to 1", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: -2, pageSize: 2 });

			// Assert
			assert.strictEqual(result.meta.currentPage, 1);
		});
	});

	describe("query", () => {
		it("should apply query filters", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 4 }).map((p) => ({
				...p,
				rating: Math.floor(Math.random() * 5) + 1,
			}));
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: 10,
				query: { rating: { $gte: 3 } },
			});

			// Assert
			assert.strictEqual(
				result.items.every((i: any) => i.rating >= 3),
				true,
			);
		});
	});

	describe("sort", () => {
		it("should sort ascending when sort is provided", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			const expectedResult = mockData.sort((a, b) => a.price - b.price);
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: 10,
				sort: { price: 1 },
			});

			// Assert
			assert.strictEqual(result.items[0].price, expectedResult[0].price);
		});

		it("should sort descending when sort is provided", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			const expected = mockData.sort((a, b) => b.price - a.price);
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: 10,
				sort: { price: -1 },
			});

			// Assert
			assert.strictEqual(result.items[0].price, expected[0].price);
		});

		it("should sort by createdAt desc when sort is not provided", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 }).map((p) => ({
				...p,
				createdAt: new Date(
					// random time in future
					p.createdAt.getTime() + Math.floor(Math.random() * 99999999),
				),
			}));
			const expectedResult = mockData.sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
			);

			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 1, pageSize: 10 });

			// Assert
			assert.strictEqual(
				result.items[0].createdAt.toISOString(),
				expectedResult[0].createdAt.toISOString(),
			);
		});
	});

	describe("skip", () => {
		it("should skip items based on page and size", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 }).map(
				(p, i) => ({
					...p,
					price: i + 1,
				}),
			);
			const expectedResult = mockData
				.sort((a, b) => a.price - b.price) // ascending
				.slice(2, 4);
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 2,
				pageSize: 2,
				sort: { price: 1 }, // ascending
			});

			// Assert
			assert.strictEqual(result.items[0].name, expectedResult[0].name);
		});

		it("should not overlap items across adjacent pages", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			const sorted = mockData.sort((a, b) => a.price - b.price);
			await Product.insertMany(mockData);

			// Act
			const page1 = await paginator.paginate({
				pageNumber: 1,
				pageSize: 3,
				sort: { price: 1 },
			});
			const page2 = await paginator.paginate({
				pageNumber: 2,
				pageSize: 3,
				sort: { price: 1, _id: 1 },
			});

			// Assert
			const page1Names = page1.items.map((i) => i.name);
			const overlap = page2.items.some((i) => page1Names.includes(i.name));
			assert.strictEqual(overlap, false);
			assert.strictEqual(page1.items[0].price, sorted[0].price);
			assert.strictEqual(page2.items[0].price, sorted[3].price);
		});
	});

	describe("pipeline", () => {
		it("should apply additional aggregate pipeline (project)", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate<{ price: number }>({
				pageNumber: 1,
				pageSize: 10,
				pipeline: [{ $project: { _id: 0, price: 1 } }],
				sort: { price: 1 },
			});

			// Assert
			assert.strictEqual(
				result.items.every((i) => Object.keys(i).length === 1),
				true,
			);
		});
	});

	describe("meta", () => {
		it("should report totalItems equal to matched documents", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			const expectedResult = mockData.filter((p) => p.price >= 50);
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: 2,
				query: { price: { $gte: 50 } },
			});

			// Assert
			assert.strictEqual(result.meta.totalItems, expectedResult.length);
		});

		it("should compute totalPages using ceiling division", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 11 });
			const pageSize = 2;
			const expectedResult = Math.ceil(mockData.length / pageSize);
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 1, pageSize });

			// Assert
			assert.strictEqual(result.meta.totalPages, expectedResult);
		});

		it("should set hasNextPage true when more pages exist", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 1, pageSize: 2 });

			// Assert
			assert.strictEqual(result.meta.hasNextPage, true);
		});

		it("should set hasNextPage false on last page", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 2, pageSize: 5 });

			// Assert
			assert.strictEqual(result.meta.hasNextPage, false);
		});

		it("should set hasPreviousPage true when page > 1", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 2, pageSize: 1 });

			// Assert
			assert.strictEqual(result.meta.hasPreviousPage, true);
		});

		it("should set hasPreviousPage false on first page", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 1, pageSize: 10 });

			// Assert
			assert.strictEqual(result.meta.hasPreviousPage, false);
		});

		it("should return empty items when no documents match", async () => {
			// Arrange - no insert
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: 5,
				query: { price: { $gt: 100 } },
			});

			// Assert
			assert.strictEqual(result.items.length, 0);
		});

		it("should report totalItems as 0 when no documents match", async () => {
			// Arrange - no insert
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: 5,
				query: { price: { $gt: 100 } },
			});

			// Assert
			assert.strictEqual(result.meta.totalItems, 0);
		});

		it("should return empty items and correct meta when page > totalPages", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({ pageNumber: 10, pageSize: 2 });

			// Assert
			assert.strictEqual(result.items.length, 0);
			assert.strictEqual(result.meta.totalPages, 3);
			assert.strictEqual(result.meta.currentPage, 10);
			assert.strictEqual(result.meta.hasNextPage, false);
			assert.strictEqual(result.meta.hasPreviousPage, true);
		});

		it("should set totalPages to 0 and flags false when no documents match", async () => {
			// Arrange
			const mockData = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockData);

			// Act
			const result = await paginator.paginate({
				pageNumber: 1,
				pageSize: 5,
				query: { price: { $gt: 1000 } },
			});

			// Assert
			assert.strictEqual(result.items.length, 0);
			assert.strictEqual(result.meta.totalItems, 0);
			assert.strictEqual(result.meta.totalPages, 1);
			assert.strictEqual(result.meta.hasNextPage, false);
			assert.strictEqual(result.meta.hasPreviousPage, false);
		});
	});
});
