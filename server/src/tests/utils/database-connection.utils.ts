import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer;

export async function connectTestDatabase() {
	mongo = await MongoMemoryServer.create();
	const uri = mongo.getUri();

	await mongoose.connect(uri, {
		maxPoolSize: 1,
		minPoolSize: 1,
		socketTimeoutMS: 10000,
	});

	await ensureIndexes();
}
export async function disconnectTestDatabase() {
	await mongoose.disconnect();

	if (mongo) {
		await mongo.stop({ doCleanup: true });
	}
}

/**
 * Ensures all model indexes are created and ready
 */
async function ensureIndexes(): Promise<void> {
	const promises: Array<Promise<unknown>> = [];

	// Get all registered models and ensure their indexes
	for (const modelName of mongoose.modelNames()) {
		const model = mongoose.model(modelName);
		promises.push(model.ensureIndexes());
	}

	await Promise.all(promises);
}
