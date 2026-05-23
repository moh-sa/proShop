import { Button } from "@/components/ui/button";
import { formatDate, getLast8Chars } from "@/shared/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { getActivePaymentUrl } from "../helpers/get-active-payment-url";
import type { Order } from "../types";
import { OrderReceiptCard } from "./order-receipt/order-receipt-card";
import { OrderStatusBadge } from "./order-status-badge";

type OrderDetailViewProps = {
	order: Order;
};

export function OrderDetailView(props: OrderDetailViewProps) {
	const paymentUrl = getActivePaymentUrl(props.order);

	return (
		<div className="mx-auto max-w-3xl space-y-8">
			<header className="space-y-4">
				<Link
					to="/profile/orders"
					className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeftIcon className="size-4" />
					Back to Order History
				</Link>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
							Order {getLast8Chars(props.order.id)}
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Placed on{" "}
							<time dateTime={props.order.createdAt.toISOString()}>
								{formatDate(props.order.createdAt)}
							</time>
						</p>
					</div>
					<OrderStatusBadge status={props.order.status} />
				</div>
				{paymentUrl ? (
					<Button
						className="w-full sm:w-auto"
						nativeButton={false}
						render={
							<a href={paymentUrl} rel="noopener noreferrer" target="_blank" />
						}
					>
						Complete Payment
						<ExternalLinkIcon className="size-4" />
					</Button>
				) : null}
			</header>

			<OrderReceiptCard receipt={props.order} />
		</div>
	);
}
