import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { formatDate, formatPrice } from "@/shared/utils";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import type { DashboardRecentOrder } from "../../schemas";

type RecentOrdersCardProps = {
	orders: Array<DashboardRecentOrder>;
};

export function RecentOrdersCard(props: RecentOrdersCardProps) {
	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle>Recent Orders</CardTitle>
				<Button
					variant="ghost"
					size="sm"
					nativeButton={false}
					render={<Link to="/dashboard/orders" />}
				>
					View All
					<ChevronRightIcon className="size-4" />
				</Button>
			</CardHeader>
			<CardContent>
				{props.orders.length === 0 ? (
					<p className="text-sm text-muted-foreground">No orders yet.</p>
				) : (
					<ul className="divide-y">
						{props.orders.map((order) => (
							<li
								key={order.id}
								className="relative flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:bg-muted"
							>
								<div className="min-w-0">
									<Link
										to="/dashboard/orders/$orderId"
										params={{ orderId: order.id }}
										className="inline-block max-w-full truncate font-medium"
									>
										{order.user.name}
									</Link>
									<p className="text-xs text-muted-foreground">
										{formatDate(order.createdAt)}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<span className="font-medium">
										{formatPrice(order.totalPrice)}
									</span>
									<OrderStatusBadge status={order.status} />
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
