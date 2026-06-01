import { MONTHS_OF_REVENUE } from "../constants/order.constants.js";
import { ValidationError } from "../errors/index.js";
import {
	type IStatsRepository,
	statsRepository,
} from "../repositories/stats.repository.js";
import { statsResponseSchema } from "../schemas/stats/stats.schema.js";
import type { MethodReturn, Result, StatsResponse } from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";

export interface IStatsService {
	getStatsSummary(): Promise<StatsResult<StatsResponse>>;
}

type StatsResult<T> = Result<T>;

export class StatsService implements IStatsService {
	private readonly _repository: IStatsRepository;

	constructor(repository?: IStatsRepository) {
		this._repository = repository ?? statsRepository;
	}

	public async getStatsSummary(): MethodReturn<
		IStatsService,
		"getStatsSummary"
	> {
		const logger = this._getLogger({ method: "getStatsSummary" });
		logger.debug("Fetching stats summary");

		const result = await this._repository.getStatsSummary();
		if (!result.success) {
			logger.error({ error: result.error }, "Failed to fetch stats summary");
			return result;
		}

		const validationResult = statsResponseSchema.safeParse(result.data);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error },
				"Invalid stats summary data",
			);
			return {
				error: new ValidationError("Invalid stats summary data", {
					cause: validationResult.error,
				}),
				success: false,
			};
		}

		logger.info("Stats summary fetched successfully");

		return {
			data: {
				...validationResult.data,
				revenueByMonth: this._fillMissingMonths(
					validationResult.data.revenueByMonth,
				),
			},
			success: true,
		};
	}

	/**
	 * Generates a range of months for a given count
	 * @param count - The number of months to generate
	 * @returns An array of strings representing the months
	 */
	private _generateMonthRange(count: number): Array<string> {
		const base = new Date();
		base.setDate(1);
		base.setHours(0, 0, 0, 0);

		return Array.from({ length: count }, (_, i) => {
			const date = new Date(base);
			date.setMonth(date.getMonth() - (count - 1 - i));
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			return `${year}-${month}`;
		});
	}

	/**
	 * Fills missing months in the revenue by month data
	 * @param data - The revenue by month data
	 * @param monthCount - The number of months to fill
	 * @returns An array of objects with the month and revenue
	 */
	private _fillMissingMonths(
		data: Array<{ month: string; revenue: number }>,
		monthCount: number = MONTHS_OF_REVENUE,
	): Array<{ month: string; revenue: number }> {
		const revenueMap = new Map(data.map((item) => [item.month, item.revenue]));

		return this._generateMonthRange(monthCount).map((month) => ({
			month,
			revenue: revenueMap.get(month) ?? 0,
		}));
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "stats service", ...args });
	}
}

export const statsService = new StatsService();
