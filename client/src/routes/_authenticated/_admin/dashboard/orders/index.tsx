import { OrdersTable } from "@/features/admin/components";
import { adminOrdersQueryOptions } from "@/features/admin/queries";
import { adminOrdersSearchSchema } from "@/features/admin/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { OrdersIndexPending } from "./-index-pending";

export const Route = createFileRoute(
	"/_authenticated/_admin/dashboard/orders/",
)({
	validateSearch: adminOrdersSearchSchema,
	loaderDeps: ({ search }) => search,
	async loader({ context, deps }) {
		await context.client.ensureQueryData(adminOrdersQueryOptions(deps));
	},
	component: OrdersPage,
	pendingComponent: OrdersIndexPending,
});

function OrdersPage() {
	const search = Route.useSearch();
	const { data } = useSuspenseQuery(adminOrdersQueryOptions(search));

	return <OrdersTable data={data} search={search} />;
}
