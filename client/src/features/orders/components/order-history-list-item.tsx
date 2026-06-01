import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, getLast8Chars } from "@/shared/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import { getActivePaymentUrl } from "../helpers/get-active-payment-url";
import type { OrderListItem } from "../types";
import { OrderStatusBadge } from "./order-status-badge";

type OrderHistoryListItemProps = {
	order: OrderListItem;
	search: Record<string, unknown>;
};

export function OrderHistoryListItem(props: OrderHistoryListItemProps) {
	const { order } = props;
	const paymentUrl = getActivePaymentUrl(order);

	return (
		<div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
			<div className="min-w-0 flex-1 space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<OrderStatusBadge status={order.status} />
					<time
						className="text-sm text-muted-foreground"
						dateTime={order.createdAt.toISOString()}
					>
						{formatDate(order.createdAt)}
					</time>
				</div>
				<p className="text-sm text-foreground tabular-nums" title={order.id}>
					Order {getLast8Chars(order.id)}
				</p>
				<p className="text-base font-medium tabular-nums">
					{formatPrice(order.totalPrice)}
				</p>
			</div>

			<div className="flex shrink-0 flex-wrap items-center gap-2">
				{paymentUrl ? (
					<Button
						className="w-full sm:w-auto"
						nativeButton={false}
						render={
							<a href={paymentUrl} rel="noopener noreferrer" target="_blank" />
						}
						size="sm"
						variant="outline"
					>
						Complete Payment
						<ExternalLinkIcon className="size-4" />
					</Button>
				) : null}

				<Button
					className="w-full sm:w-auto"
					nativeButton={false}
					render={
						<Link
							to="/profile/orders/$orderId"
							params={{ orderId: order.id }}
							search={props.search}
						/>
					}
					size="sm"
					variant="secondary"
				>
					View Details
					<ChevronRightIcon className="size-4" />
				</Button>
			</div>
		</div>
	);
}
