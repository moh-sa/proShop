import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import type { OrderListItem } from "@/features/orders/types";
import { formatDate, formatPrice, getLast8Chars } from "@/shared/utils";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";

type OrderColumnsParams = {
	search: Record<string, unknown>;
};

export function getOrderColumns(
	params: OrderColumnsParams,
): Array<ColumnDef<OrderListItem>> {
	return [
		{
			accessorKey: "id",
			header: "Order ID",
			cell: ({ row }) => (
				<span title={row.original.id} className="font-mono font-medium">
					{getLast8Chars(row.original.id)}
				</span>
			),
		},
		{
			accessorKey: "user.name",
			header: "Customer",
			cell: ({ row }) => (
				<span
					title={row.original.user.name}
					className="block max-w-[18ch] truncate font-medium md:max-w-[24ch]"
				>
					{row.original.user.name}
				</span>
			),
		},
		{
			accessorKey: "totalPrice",
			header: "Total",
			cell: ({ row }) => (
				<span className="font-medium tabular-nums">
					{formatPrice(row.original.totalPrice)}
				</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<OrderStatusBadge status={row.original.status} className="capitalize" />
			),
		},
		{
			accessorKey: "createdAt",
			header: "Date",
			cell: ({ row }) => formatDate(row.original.createdAt),
		},
		{
			id: "actions",
			header: () => <div className="text-right">Actions</div>,
			cell: ({ row }) => (
				<div className="flex justify-end gap-2">
					<Button
						size="sm"
						variant="secondary"
						nativeButton={false}
						className="text-end"
						render={
							<Link
								to="/dashboard/orders/$orderId"
								params={{ orderId: row.original.id }}
								search={params.search}
							/>
						}
					>
						<EyeIcon className="size-4" />
						View
					</Button>
				</div>
			),
		},
	];
}
