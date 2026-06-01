import { DashboardOverview } from "@/features/admin/components";
import { dashboardStatsQueryOptions } from "@/features/admin/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin/dashboard/")({
	loader: async ({ context }) => {
		await context.client.ensureQueryData(dashboardStatsQueryOptions());
	},
	component: DashboardPage,
});

function DashboardPage() {
	const { data: stats } = useSuspenseQuery(dashboardStatsQueryOptions());

	return <DashboardOverview stats={stats} />;
}
