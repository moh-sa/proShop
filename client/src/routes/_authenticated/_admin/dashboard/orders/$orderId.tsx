import { AdminOrderDetail } from "@/features/admin/components";
import { adminOrderDetailQueryOptions } from "@/features/admin/queries";
import { adminOrdersSearchSchema } from "@/features/admin/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/_admin/dashboard/orders/$orderId",
)({
	validateSearch: adminOrdersSearchSchema,
	async loader({ context, params }) {
		await context.client.ensureQueryData(
			adminOrderDetailQueryOptions(params.orderId),
		);
	},
	component: OrderDetailPage,
});

function OrderDetailPage() {
	const { orderId } = Route.useParams();
	const search = Route.useSearch();
	const { data: order } = useSuspenseQuery(
		adminOrderDetailQueryOptions(orderId),
	);

	return <AdminOrderDetail order={order} search={search} />;
}
