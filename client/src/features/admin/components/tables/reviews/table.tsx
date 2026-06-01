import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Frame, FramePanel } from "@/components/ui/frame";
import { useDeleteWithConfirm } from "@/features/admin/hooks";
import { adminDeleteReviewMutationOptions } from "@/features/admin/queries";
import { Pagination } from "@/features/pagination";
import type { Review } from "@/features/reviews/types";
import type { ApiPaginatedResponse } from "@/shared/api";
import { ErrorAlert } from "@/shared/errors";
import { PageHeader } from "@/shared/layout/page";
import { StarIcon } from "lucide-react";
import React from "react";
import { getReviewColumns } from "./columns";

type ReviewsTableProps = {
	data: ApiPaginatedResponse<Review>;
	search: Record<string, unknown>;
};

type ReviewDeleteTarget = { id: string; userName: string };

export function ReviewsTable(props: ReviewsTableProps) {
	const { error, deleteTarget, isPending, openDeleteDialog, closeDeleteDialog, handleConfirm } =
		useDeleteWithConfirm<ReviewDeleteTarget>(adminDeleteReviewMutationOptions, {
			successToast: "Review deleted successfully",
			errorToast: "Failed to delete review",
		});

	const columns = React.useMemo(
		() => getReviewColumns({ search: props.search, onDeleteClick: openDeleteDialog }),
		[props.search, openDeleteDialog],
	);

	return (
		<div>
			<PageHeader
				title="Reviews"
				description={`${props.data.meta.totalItems} reviews`}
			/>

			{error ? (
				<ErrorAlert
					title="Could not delete review"
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
							title="No reviews Found"
							description="Either there are no reviews in the database or you have filtered them out."
							icon={StarIcon}
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
				title="Delete review?"
				description={`This will permanently delete the review by "${deleteTarget?.userName}". This action cannot be undone.`}
				actionLabel="Delete"
				onAction={handleConfirm}
				isPending={isPending}
			/>
		</div>
	);
}
