import { OrderHistoryList } from "@/features/orders/components/order-history-list";
import { userPaginatedOrdersQueryOptions } from "@/features/orders/queries";
import { paginationParamsSchema } from "@/features/pagination";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { OrderHistoryPending } from "./-order-pending";

export const Route = createFileRoute("/_authenticated/profile/orders/")({
	validateSearch: paginationParamsSchema,
	loaderDeps: ({ search }) => search,
	async loader({ context, deps }) {
		await context.client.ensureQueryData(
			userPaginatedOrdersQueryOptions(context.user.id, deps),
		);
	},
	component: RouteComponent,
	pendingComponent: OrderHistoryPending,
});

function RouteComponent() {
	const { user } = Route.useRouteContext();
	const search = Route.useSearch();
	const { data } = useSuspenseQuery(
		userPaginatedOrdersQueryOptions(user.id, search),
	);

	return (
		<OrderHistoryList orders={data.data} meta={data.meta} search={search} />
	);
}
