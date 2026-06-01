import { Button } from "@/components/ui/button";
import type { ProductListItem } from "@/features/products/types";
import { formatPrice } from "@/shared/utils";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon } from "lucide-react";

type ProductDeleteTarget = { id: string; name: string };

type ProductColumnsParams = {
	search: Record<string, unknown>;
	onDeleteClick: (target: ProductDeleteTarget) => void;
};

export function getProductColumns(
	params: ProductColumnsParams,
): Array<ColumnDef<ProductListItem>> {
	return [
		{
			accessorKey: "image",
			header: "Image",
			cell: ({ row }) => (
				<img
					src={row.original.image}
					alt={`${row.original.name} thumbnail`}
					width={48}
					height={48}
					className="size-12 rounded-md object-cover"
				/>
			),
		},
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => (
				<span
					title={row.original.name}
					className="block max-w-[20ch] truncate font-medium md:max-w-[28ch]"
				>
					{row.original.name}
				</span>
			),
		},
		{
			accessorKey: "brand",
			header: "Brand",
			cell: ({ row }) => (
				<span
					title={row.original.brand}
					className="block max-w-[12ch] truncate md:max-w-[16ch]"
				>
					{row.original.brand}
				</span>
			),
		},
		{
			accessorKey: "category",
			header: "Category",
			cell: ({ row }) => (
				<span
					title={row.original.category}
					className="block max-w-[12ch] truncate md:max-w-[16ch]"
				>
					{row.original.category}
				</span>
			),
		},
		{
			accessorKey: "price",
			header: "Price",
			cell: ({ row }) => (
				<span className="font-medium tabular-nums">
					{formatPrice(row.original.price)}
				</span>
			),
		},
		{
			accessorKey: "countInStock",
			header: "Stock",
		},
		{
			accessorKey: "rating",
			header: "Rating",
			cell: ({ row }) => `${row.original.rating.toFixed(1)}/5`,
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
						render={
							<Link
								to="/dashboard/products/$productId/edit"
								params={{ productId: row.original.id }}
								search={params.search}
							/>
						}
					>
						<PencilIcon className="size-4" />
						Edit
					</Button>
					<Button
						size="sm"
						variant="destructive"
						className="text-end"
						onClick={() =>
							params.onDeleteClick({
								id: row.original.id,
								name: row.original.name,
							})
						}
					>
						<TrashIcon className="size-4" />
						Delete
					</Button>
				</div>
			),
		},
	];
}
