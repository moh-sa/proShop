import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer;

export async function connectTestDatabase() {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri);

  await ensureIndexes();
}

export async function disconnectTestDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
}

/**
 * Ensures all model indexes are created and ready
 */
async function ensureIndexes(): Promise<void> {
  const promises = [];

  // Get all registered models and ensure their indexes
  for (const modelName of mongoose.modelNames()) {
    const model = mongoose.model(modelName);
    promises.push(model.ensureIndexes());
  }

  await Promise.all(promises);
}
