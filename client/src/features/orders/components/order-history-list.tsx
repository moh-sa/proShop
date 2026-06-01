import { Frame, FramePanel } from "@/components/ui/frame";
import { Pagination } from "@/features/pagination";
import type { PaginationMeta } from "@/shared/api";
import { PageHeader } from "@/shared/layout/page";
import type { OrderListItem } from "../types";
import { EmptyOrderHistory } from "./empty-order-history";
import { OrderHistoryListItem } from "./order-history-list-item";

type OrderHistoryListProps = {
	orders: OrderListItem[];
	meta: PaginationMeta;
	search: Record<string, unknown>;
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
				<PageHeader title="Order History" description={ordersText} />
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
								<OrderHistoryListItem order={order} search={props.search} />
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
