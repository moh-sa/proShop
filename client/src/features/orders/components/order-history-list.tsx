import { Frame, FramePanel } from "@/components/ui/frame";
import { Pagination } from "@/features/pagination";
import type { PaginationMeta } from "@/shared/api";
import type { OrderListItem } from "../types";
import { EmptyOrderHistory } from "./empty-order-history";
import { OrderHistoryListItem } from "./order-history-list-item";

type OrderHistoryListProps = {
	orders: OrderListItem[];
	meta: PaginationMeta;
};

export function OrderHistoryList(props: OrderHistoryListProps) {
	const hasOrders = props.orders.length > 0;

	const ordersText =
		props.meta.totalItems === 0
			? "No orders"
			: props.meta.totalItems === 1
				? "1 order"
				: `${props.meta.totalItems} orders`;

	return (
		<div className="space-y-8">
			<header>
				<h1 className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
					Order History
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">{ordersText}</p>
			</header>

			{hasOrders ? (
				<section className="flex flex-col justify-between gap-8">
					<Frame as="ul" className="space-y-0.5">
						{props.orders.map((order) => (
							<FramePanel
								as="li"
								key={order.id}
								className="rounded-none border-0 first:rounded-t-xl last:rounded-b-xl"
							>
								<OrderHistoryListItem order={order} />
							</FramePanel>
						))}
					</Frame>
					<Pagination {...props.meta} />
				</section>
			) : (
				<EmptyOrderHistory />
			)}
		</div>
	);
}
