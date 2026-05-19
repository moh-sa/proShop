import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/features/cart";
import { OrderConfirmationScreen } from "@/features/orders/components";
import { orderDetailSuccessQueryOptions } from "@/features/orders/queries";
import { idSchema } from "@/shared/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";

export const Route = createFileRoute("/_authenticated/orders/$orderid/success")(
	{
		beforeLoad(ctx) {
			ctx.params.orderid = idSchema.parse(ctx.params.orderid);
		},
		async loader(ctx) {
			const { orderid } = ctx.params;
			await ctx.context.client.ensureQueryData(
				orderDetailSuccessQueryOptions(orderid),
			);
		},
		pendingComponent: () => (
			<Skeleton className="mx-auto min-h-dvh w-full max-w-3xl" />
		),
		component: RouteComponent,
	},
);

function RouteComponent() {
	const { orderid } = Route.useParams();
	const { data: order } = useSuspenseQuery(
		orderDetailSuccessQueryOptions(orderid),
	);

	// clear cart if order is successfully created
	React.useEffect(() => {
		useCartStore.getState().clear();
	}, []);

	return (
		<OrderConfirmationScreen
			receipt={order}
			variant={order.status === "pending" ? "pending" : "success"}
		/>
	);
}
