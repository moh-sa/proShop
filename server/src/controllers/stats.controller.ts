import { HTTP_STATUS } from "../constants/index.js";
import type { IStatsService } from "../services/stats.service.js";
import { statsService } from "../services/stats.service.js";
import type { AsyncHandler, StatsResponse } from "../types/index.js";
import {
	asyncHandler,
	fromCurrencySmallestUnit,
	getLoggerFromContext,
} from "../utils/index.js";

export interface IStatsController {
	getSummary: AsyncHandler<{
		resBody: { data: StatsResponse };
	}>;
}

export class StatsController implements IStatsController {
	private readonly _service: IStatsService;

	getSummary = asyncHandler<{
		resBody: { data: StatsResponse };
	}>(async (_req, res) => {
		const logger = this._getLogger({ method: "getSummary" });
		logger.debug("Getting stats summary");

		const result = await this._service.getStatsSummary();
		if (!result.success) {
			throw result.error;
		}

		const dataToSend: StatsResponse = {
			...result.data,
			counts: {
				...result.data.counts,
				revenue: this._toDollars(result.data.counts.revenue),
			},
			recentOrders: result.data.recentOrders.map((order) => ({
				...order,
				totalPrice: this._toDollars(order.totalPrice),
			})),
			revenueByMonth: result.data.revenueByMonth.map((entry) => ({
				...entry,
				revenue: this._toDollars(entry.revenue),
			})),
		};

		logger.info("Stats summary retrieved successfully");

		res.status(HTTP_STATUS.OK).json({
			data: dataToSend,
			success: true,
		});
	});

	constructor(service?: IStatsService) {
		this._service = service ?? statsService;
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "stats controller", ...args });
	}

	private _toDollars(amount: number): number {
		return fromCurrencySmallestUnit({
			amount,
			currency: "USD",
		});
	}
}

export const statsController = new StatsController();
