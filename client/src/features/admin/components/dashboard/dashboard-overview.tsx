import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatPrice } from "@/shared/utils";
import {
	DollarSignIcon,
	PackageIcon,
	ShoppingCartIcon,
	UsersIcon,
} from "lucide-react";
import type { DashboardStats } from "../../schemas";
import { LowStockCard } from "./low-stock-card";
import { RecentOrdersCard } from "./recent-orders-card";
import { RevenueChart } from "./revenue-chart";

type DashboardOverviewProps = {
	stats: DashboardStats;
};

export function DashboardOverview(props: DashboardOverviewProps) {
	const { counts, revenueByMonth, recentOrders, lowStockProducts } =
		props.stats;

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					label="Total Revenue"
					value={formatPrice(counts.revenue)}
					icon={DollarSignIcon}
				/>
				<StatCard
					label="Orders"
					value={counts.orders}
					icon={ShoppingCartIcon}
				/>
				<StatCard label="Products" value={counts.products} icon={PackageIcon} />
				<StatCard label="Users" value={counts.users} icon={UsersIcon} />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						Revenue{" "}
						<span className="text-sm text-muted-foreground">
							(last {revenueByMonth.length} months)
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<RevenueChart data={revenueByMonth} />
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-2">
				<RecentOrdersCard orders={recentOrders} />
				<LowStockCard products={lowStockProducts} />
			</div>
		</div>
	);
}
