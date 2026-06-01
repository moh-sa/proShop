import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { orderStatusSchema } from "@/features/orders/schemas";
import type { OrderListItem, OrderStatus } from "@/features/orders/types";
import { Pagination } from "@/features/pagination";
import type { ApiPaginatedResponse } from "@/shared/api";
import { PageHeader } from "@/shared/layout/page";
import { useNavigate } from "@tanstack/react-router";
import { PackageIcon } from "lucide-react";
import React from "react";
import { getOrderColumns } from "./columns";

type OrdersTableProps = {
	data: ApiPaginatedResponse<OrderListItem>;
	search: Record<string, unknown>;
};

export function OrdersTable(props: OrdersTableProps) {
	const navigate = useNavigate();

	function handleStatusFilterChange(value: string | null) {
		const status = value
			? value === "all"
				? undefined
				: (value.toLowerCase() as OrderStatus)
			: undefined;

		navigate({
			from: "/dashboard/orders/",
			search: (prev) => ({
				...prev,
				status,
				pageNumber: 1,
			}),
		});
	}

	const columns = React.useMemo(
		() =>
			getOrderColumns({
				search: props.search,
			}),
		[props.search],
	);

	return (
		<div>
			<PageHeader
				title="Orders"
				description={`${props.data.meta.totalItems} orders`}
			/>

			<Frame>
				<FramePanel className="px-3 py-2">
					{props.data.data.length > 0 ? (
						<DataTable
							columns={columns}
							data={props.data.data}
							toolbar={() => (
								<Select
									onValueChange={(value: string | null) =>
										handleStatusFilterChange(value)
									}
								>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Filter by status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All</SelectItem>
										{Object.values(orderStatusSchema.enum).map((status) => (
											<SelectItem
												key={status}
												value={status}
												className="capitalize"
											>
												{status}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					) : (
						<EmptyState
							title="No orders Found"
							description="Either there are no orders in the database or you have filtered them out."
							icon={PackageIcon}
							className="mt-6"
						/>
					)}
				</FramePanel>
			</Frame>

			<div className="mt-4">
				<Pagination {...props.data.meta} />
			</div>
		</div>
	);
}
