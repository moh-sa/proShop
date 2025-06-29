import assert from "node:assert";
import test, { before, describe, suite } from "node:test";
import { NotFoundError } from "../../errors";
import { UserService } from "../../services";
import { InsertUser, SelectUser } from "../../types";
import { formatUserServiceResponse } from "../../utils/format-user-service-response.util";
import {
  generateMockUser,
  generateMockUsers,
  mockUserRepository,
} from "../mocks";

function formatResponse({
  users,
  isTokenRequired = false,
}: {
  users: SelectUser | Array<SelectUser>;
  isTokenRequired?: boolean;
}) {
  if (Array.isArray(users)) {
    return users.map((user) =>
      formatUserServiceResponse({ user, isTokenRequired }),
    );
  } else {
    return formatUserServiceResponse({ user: users, isTokenRequired });
  }
}

suite("User Service 〖 Unit Tests 〗", () => {
  const mockRepo = mockUserRepository();
  const service = new UserService(mockRepo);

  before(() => mockRepo.reset());

  describe("getAll", () => {
    const mockUsers = generateMockUsers(1);
    const expectedResult = formatResponse({ users: mockUsers });

    test("Should return 'array of users' without 'password' and 'token' when 'repo.getAll' is called once with no args", async () => {
      mockRepo.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUsers),
      );

      const users = await service.getAll();

      assert.ok(users);
      assert.deepStrictEqual(users, expectedResult);

      assert.ok(users.every((user) => !Object.keys(user).includes("password")));
      assert.ok(users.every((user) => !Object.keys(user).includes("token")));

      assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
      assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
    });

    test("Should return 'empty array' when 'repo.getAll' returns 'empty array'", async () => {
      mockRepo.getAll.mock.mockImplementationOnce(() => Promise.resolve([]));

      const users = await service.getAll();

      assert.strictEqual(users.length, 0);
    });
  });

  describe("getById", () => {
    const mockUser = generateMockUser();
    const userId = mockUser._id;
    const expectedResult = formatResponse({ users: mockUser });

    test("Should return 'user object' without 'password' and 'token' when 'repo.getById' is called once with 'userId'", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      const user = await service.getById({ userId: mockUser._id });

      assert.ok(user);
      assert.deepStrictEqual(user, expectedResult);

      assert.ok(!Object.keys(user).includes("password"));
      assert.ok(!Object.keys(user).includes("token"));

      assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
        userId: mockUser._id,
      });
    });

    test("Should throw 'NotFoundError' when 'repo.getById' returns 'null'", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        async () => await service.getById({ userId }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.message, "User not found");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });
  });

  describe("getByEmail", () => {
    const mockUser = generateMockUser();
    const email = mockUser.email;
    const expectedResult = formatResponse({ users: mockUser });

    test("Should return 'user object' when 'repo.getByEmail' is called once with 'email'", async () => {
      mockRepo.getByEmail.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      const user = await service.getByEmail({ email });

      assert.ok(user);
      assert.deepStrictEqual(user, expectedResult);

      assert.strictEqual(mockRepo.getByEmail.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getByEmail.mock.calls[0].arguments[0], {
        email,
      });
    });

    test("Should throw 'NotFoundError' when 'repo.getByEmail' returns 'null'", async () => {
      mockRepo.getByEmail.mock.mockImplementationOnce(() =>
        Promise.resolve(null),
      );

      await assert.rejects(
        async () => await service.getByEmail({ email }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.type, "NOT_FOUND");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });
  });

  describe("update", () => {
    const mockUser = generateMockUser();
    const userId = mockUser._id;

    const updateData: Partial<InsertUser> = { name: "new-name" };
    const updatedData = { ...mockUser, ...updateData };
    const expectedResult = formatResponse({ users: updatedData });

    test("Should return 'user object' without 'password' and 'token' when 'repo.update' is called once with 'userId' and 'updateData'", async () => {
      mockRepo.update.mock.mockImplementationOnce(() =>
        Promise.resolve(updatedData),
      );

      const updatedUser = await service.updateById({
        userId,
        data: updateData,
      });

      assert.ok(updatedUser);
      assert.deepStrictEqual(updatedUser, expectedResult);

      assert.strictEqual(mockRepo.update.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.update.mock.calls[0].arguments[0], {
        userId,
        data: updateData,
      });
    });

    test("Should throw 'NotFoundError' when 'repo.update' returns 'null'", async () => {
      mockRepo.update.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        async () => await service.updateById({ userId, data: updateData }),
        (error: Error) => {
          assert.ok(error instanceof NotFoundError);
          assert.strictEqual(error.type, "NOT_FOUND");
          assert.strictEqual(error.statusCode, 404);
          return true;
        },
      );
    });
  });

  describe("delete", () => {
    const mockUser = generateMockUser();
    const userId = mockUser._id;
    const expectedResult = formatResponse({ users: mockUser });

    test("Should return 'user object' when 'repo.delete' is called once with 'userId'", async () => {
      mockRepo.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      const deletedUser = await service.delete({ userId });

      assert.ok(deletedUser);
      assert.deepStrictEqual(deletedUser, expectedResult);

      assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.delete.mock.calls[0].arguments[0], {
        userId,
      });
    });

    test("Should throw 'NotFoundError' when 'repo.delete' returns 'null'", async () => {
      mockRepo.delete.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        async () => await service.delete({ userId }),
        NotFoundError,
      );
    });
  });
});
