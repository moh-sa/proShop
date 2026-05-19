import { Skeleton } from "@/components/ui/skeleton";
import { OrderConfirmationScreen } from "@/features/orders/components";
import { orderDetailFailureQueryOptions } from "@/features/orders/queries";
import { idSchema } from "@/shared/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/orders/$orderid/failure")(
	{
		beforeLoad(ctx) {
			ctx.params.orderid = idSchema.parse(ctx.params.orderid);
		},
		async loader(ctx) {
			const { orderid } = ctx.params;
			await ctx.context.client.ensureQueryData(
				orderDetailFailureQueryOptions(orderid),
			);
		},
		component: RouteComponent,
		pendingComponent: () => (
			<Skeleton className="mx-auto min-h-dvh w-full max-w-3xl" />
		),
	},
);

function RouteComponent() {
	const { orderid } = Route.useParams();
	const { data: order } = useSuspenseQuery(
		orderDetailFailureQueryOptions(orderid),
	);

	return <OrderConfirmationScreen variant="failure" receipt={order} />;
}
