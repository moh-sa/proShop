import { get } from "@/shared/api";
import { dashboardStatsSchema, type DashboardStats } from "../schemas";

export function getDashboardStatsApi(
	signal: AbortSignal,
): Promise<DashboardStats> {
	return get("/stats", dashboardStatsSchema, signal);
}
