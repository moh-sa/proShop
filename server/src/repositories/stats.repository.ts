import {
	LOW_STOCK_THRESHOLD,
	MONTHS_OF_REVENUE,
	RECENT_ORDERS_LIMIT,
} from "../constants/order.constants.js";
import type { DatabaseBaseError } from "../errors/index.js";
import { OrderModel } from "../models/order.model.js";
import { ProductModel } from "../models/product.model.js";
import { UserModel } from "../models/user.model.js";
import type { MethodReturn, Result, StatsResponse } from "../types/index.js";
import {
	getMonthsAgo,
	handleDatabaseErrorResult,
	serializeMongoResult,
} from "../utils/index.js";

export interface IStatsRepository {
	getStatsSummary(): Promise<StatsResult<StatsResponse>>;
}

type StatsResult<T> = Result<T, DatabaseBaseError>;

export class StatsRepository implements IStatsRepository {
	private readonly _orderModel: typeof OrderModel;
	private readonly _userModel: typeof UserModel;
	private readonly _productModel: typeof ProductModel;

	constructor(
		orderModel?: typeof OrderModel,
		userModel?: typeof UserModel,
		productModel?: typeof ProductModel,
	) {
		this._orderModel = orderModel ?? OrderModel;
		this._userModel = userModel ?? UserModel;
		this._productModel = productModel ?? ProductModel;
	}

	public async getStatsSummary(): MethodReturn<
		IStatsRepository,
		"getStatsSummary"
	> {
		try {
			const monthsAgo = getMonthsAgo(MONTHS_OF_REVENUE);
			const excludedStatusMatch = {
				status: { $nin: ["cancelled", "pending"] },
			};

			// get total orders
			const totalOrdersPromise = this._orderModel.countDocuments();

			// get total users
			const totalUsersPromise = this._userModel.countDocuments();

			// get total products
			const totalProductsPromise = this._productModel.countDocuments();

			// get total revenue
			const totalRevenuePromise = this._orderModel.aggregate<{ total: number }>(
				[
					{ $match: excludedStatusMatch },
					{ $group: { _id: null, total: { $sum: "$totalPrice" } } },
				],
			);

			// get recent orders
			const recentOrdersPromise = this._orderModel
				.find()
				.sort({ createdAt: -1 })
				.limit(RECENT_ORDERS_LIMIT)
				.select("createdAt status totalPrice user.email user.id user.name")
				.lean();

			// get low stock products
			const lowStockProductsPromise = this._productModel
				.find({ countInStock: { $lte: LOW_STOCK_THRESHOLD } })
				.sort({ countInStock: 1 })
				.select("_id countInStock image name")
				.lean();

			// get revenue by month
			const revenueByMonthPromise = this._orderModel.aggregate<{
				month: string;
				revenue: number;
			}>([
				{
					$match: {
						...excludedStatusMatch,
						createdAt: { $gte: monthsAgo },
					},
				},
				{
					$group: {
						_id: {
							$dateToString: { date: "$createdAt", format: "%Y-%m" },
						},
						revenue: { $sum: "$totalPrice" },
					},
				},
				{ $sort: { _id: 1 } },
				{
					$project: {
						_id: 0,
						month: "$_id",
						revenue: 1,
					},
				},
			]);

			const [
				[revenueResult],
				totalOrders,
				totalUsers,
				totalProducts,
				recentOrders,
				lowStockProducts,
				revenueByMonthResult,
			] = await Promise.all([
				totalRevenuePromise,
				totalOrdersPromise,
				totalUsersPromise,
				totalProductsPromise,
				recentOrdersPromise,
				lowStockProductsPromise,
				revenueByMonthPromise,
			]);

			const totalRevenue = revenueResult?.total ?? 0;

			return {
				data: {
					counts: {
						orders: totalOrders,
						products: totalProducts,
						revenue: totalRevenue,
						users: totalUsers,
					},
					revenueByMonth: revenueByMonthResult,
					recentOrders: serializeMongoResult(recentOrders),
					lowStockProducts: serializeMongoResult(lowStockProducts),
				},
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): StatsResult<never> {
		return handleDatabaseErrorResult(error);
	}
}

export const statsRepository = new StatsRepository();
