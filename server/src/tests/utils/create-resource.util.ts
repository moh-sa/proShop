import assert from "node:assert/strict";
import {
	orderRepository,
	productRepository,
	reviewRepository,
	sessionRepository,
	userRepository,
} from "../../repositories";
import {
	CreateOrder,
	CreateProduct,
	CreateReview,
	CreateSession,
	CreateUser,
} from "../../types";

// ORDER
export async function createOrder(data: CreateOrder) {
	const createdOrder = await orderRepository.create(data);
	assert.ok(createdOrder.success);

	return createdOrder.data;
}

export async function createOrders(data: Array<CreateOrder>) {
	const createdOrders = await Promise.all(
		data.map((order) => orderRepository.create(order)),
	);
	assert.ok(createdOrders.every((order) => order.success));

	return createdOrders.map((order) => order.data);
}

// PRODUCT
type CreateProductWithStringImage = Omit<CreateProduct, "image"> & {
	image: string;
};

export async function createProduct(data: CreateProductWithStringImage) {
	const createdProduct = await productRepository.create(data);
	assert.ok(createdProduct.success);

	return createdProduct.data;
}

export async function createProducts(
	data: Array<CreateProductWithStringImage>,
) {
	const createdProducts = await Promise.all(
		data.map((product) => productRepository.create(product)),
	);
	assert.ok(createdProducts.every((product) => product.success));

	return createdProducts.map((product) => product.data);
}

// REVIEW
export async function createReview(data: CreateReview) {
	const createdReview = await reviewRepository.create(data);
	assert.ok(createdReview.success);

	return createdReview.data;
}

export async function createReviews(data: Array<CreateReview>) {
	const createdReviews = await Promise.all(
		data.map((review) => reviewRepository.create(review)),
	);
	assert.ok(createdReviews.every((review) => review.success));

	return createdReviews.map((review) => review.data);
}

// USER
export async function createUser(data: CreateUser) {
	const createdUser = await userRepository.create(data);
	assert.ok(createdUser.success);

	return createdUser.data;
}

export async function createUsers(data: Array<CreateUser>) {
	const createdUsers = await Promise.all(
		data.map((user) => userRepository.create(user)),
	);
	assert.ok(createdUsers.every((user) => user.success));

	return createdUsers.map((user) => user.data);
}

// SESSION
export async function createSession(data: CreateSession) {
	const createdSession = await sessionRepository.create(data);
	assert.ok(createdSession.success);

	return createdSession.data;
}

export async function createSessions(data: Array<CreateSession>) {
	const createdSessions = await Promise.all(
		data.map((session) => sessionRepository.create(session)),
	);
	assert.ok(createdSessions.every((session) => session.success));

	return createdSessions.map((session) => session.data);
}
