import { OrderDetailView } from "@/features/orders/components/order-detail-view";
import { orderDetailSuccessQueryOptions } from "@/features/orders/queries/orders.queries";
import { idSchema } from "@/shared/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";
import { OrderDetailPending } from "./-order-pending";

export const Route = createFileRoute("/_authenticated/profile/orders/$orderId")(
	{
		params: {
			parse: (raw) => {
				const parsed = z
					.object({
						orderId: idSchema,
					})
					.safeParse(raw);
				if (!parsed.success) {
					throw redirect({
						to: "/not-found",
						replace: true,
					});
				}

				return parsed.data;
			},
		},
		loader: async ({ context, params }) => {
			await context.client.ensureQueryData(
				orderDetailSuccessQueryOptions(params.orderId),
			);
		},
		component: RouteComponent,
		pendingComponent: OrderDetailPending,
	},
);

function RouteComponent() {
	const search = Route.useSearch();
	const { orderId } = Route.useParams();
	const { data: order } = useSuspenseQuery(
		orderDetailSuccessQueryOptions(orderId),
	);

	return <OrderDetailView order={order} search={search} />;
}
