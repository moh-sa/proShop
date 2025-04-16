import { faker } from "@faker-js/faker";
import { mock } from "node:test";
import { IImageStorageManager } from "../../managers";

export function mockImageStorage(): IImageStorageManager {
  return {
    upload: mock.fn(() => Promise.resolve(faker.image.url())),
    delete: mock.fn(() => Promise.resolve()),
    replace: mock.fn(() => Promise.resolve(faker.image.url())),
  };
}
