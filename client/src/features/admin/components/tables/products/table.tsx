import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Frame, FramePanel } from "@/components/ui/frame";
import { useDeleteWithConfirm } from "@/features/admin/hooks";
import { deleteProductMutationOptions } from "@/features/admin/queries";
import { Pagination } from "@/features/pagination";
import type { ProductListItem } from "@/features/products/types";
import type { ApiPaginatedResponse } from "@/shared/api";
import { ErrorAlert } from "@/shared/errors";
import { PageHeader } from "@/shared/layout/page";
import { Link } from "@tanstack/react-router";
import { PackageSearch, PlusIcon } from "lucide-react";
import React from "react";
import { getProductColumns } from "./columns";

type ProductsTableProps = {
	data: ApiPaginatedResponse<ProductListItem>;
	search: Record<string, unknown>;
};

type DeleteTarget = { id: string; name: string };

export function ProductsTable(props: ProductsTableProps) {
	const {
		error,
		deleteTarget,
		isPending,
		openDeleteDialog,
		closeDeleteDialog,
		handleConfirm,
	} = useDeleteWithConfirm<DeleteTarget>(deleteProductMutationOptions, {
		successToast: "Product deleted successfully",
		errorToast: "Failed to delete product",
	});

	const columns = React.useMemo(
		() =>
			getProductColumns({
				search: props.search,
				onDeleteClick: openDeleteDialog,
			}),
		[props.search, openDeleteDialog],
	);

	return (
		<div>
			<PageHeader
				title="Products"
				description={`${props.data.meta.totalItems} products`}
				actions={
					<Button
						size="sm"
						nativeButton={false}
						render={<Link to="/dashboard/products/new" />}
					>
						<PlusIcon className="size-4" />
						New Product
					</Button>
				}
			/>

			{error ? (
				<ErrorAlert
					title="Could not delete product"
					message={error}
					className="mb-4"
				/>
			) : null}

			<Frame>
				<FramePanel className="px-3 py-2">
					{props.data.data.length > 0 ? (
						<DataTable columns={columns} data={props.data.data} />
					) : (
						<EmptyState
							title="No products Found"
							description="Either there are no products in the database or you have filtered them out."
							icon={PackageSearch}
							className="mt-6"
						/>
					)}
				</FramePanel>
			</Frame>

			<div className="mt-4">
				<Pagination {...props.data.meta} />
			</div>

			<ConfirmAlertDialog
				isOpen={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) closeDeleteDialog();
				}}
				title="Delete product?"
				description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
				actionLabel="Delete"
				onAction={handleConfirm}
				isPending={isPending}
			/>
		</div>
	);
}
