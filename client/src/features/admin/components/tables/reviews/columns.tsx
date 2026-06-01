import { Button } from "@/components/ui/button";
import type { Review } from "@/features/reviews/types";
import { formatDate, getLast8Chars } from "@/shared/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { TrashIcon } from "lucide-react";

type ReviewDeleteTarget = { id: string; userName: string };

type ReviewColumnsParams = {
	search: Record<string, unknown>;
	onDeleteClick: (target: ReviewDeleteTarget) => void;
};

export function getReviewColumns(
	params: ReviewColumnsParams,
): Array<ColumnDef<Review>> {
	return [
		{
			accessorKey: "user.name",
			header: "User",
			cell: ({ row }) => (
				<span
					title={row.original.user.name}
					className="block max-w-[16ch] truncate font-medium md:max-w-[20ch]"
				>
					{row.original.user.name}
				</span>
			),
		},
		{
			accessorKey: "productId",
			header: "Product ID",
			cell: ({ row }) => (
				<span title={row.original.productId} className="font-mono text-xs">
					{getLast8Chars(row.original.productId)}
				</span>
			),
		},
		{
			accessorKey: "rating",
			header: "Rating",
			cell: ({ row }) => `${row.original.rating.toFixed(1)}/5`,
		},
		{
			accessorKey: "comment",
			header: "Comment",
			cell: ({ row }) => (
				<span
					title={row.original.comment}
					className="block max-w-[24ch] truncate md:max-w-[36ch]"
				>
					{row.original.comment}
				</span>
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
						variant="destructive"
						className="text-end"
						onClick={() =>
							params.onDeleteClick({
								id: row.original.id,
								userName: row.original.user.name,
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
