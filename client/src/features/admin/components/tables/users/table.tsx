import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Frame, FramePanel } from "@/components/ui/frame";
import { useDeleteWithConfirm } from "@/features/admin/hooks";
import { deleteUserMutationOptions } from "@/features/admin/queries";
import { Pagination } from "@/features/pagination";
import type { User } from "@/features/users/types";
import type { ApiPaginatedResponse } from "@/shared/api";
import { ErrorAlert } from "@/shared/errors";
import { PageHeader } from "@/shared/layout/page";
import { UserIcon } from "lucide-react";
import React from "react";
import { getUserColumns } from "./columns";

type UsersTableProps = {
	data: ApiPaginatedResponse<User>;
	search: Record<string, unknown>;
};

export function UsersTable(props: UsersTableProps) {
	const { error, deleteTarget, isPending, openDeleteDialog, closeDeleteDialog, handleConfirm } =
		useDeleteWithConfirm<User>(deleteUserMutationOptions, {
			successToast: "User deleted successfully",
			errorToast: "Failed to delete user",
		});

	const columns = React.useMemo(
		() => getUserColumns({ search: props.search, onDeleteClick: openDeleteDialog }),
		[props.search, openDeleteDialog],
	);

	return (
		<div>
			<PageHeader
				title="Users"
				description={`${props.data.meta.totalItems} users`}
			/>

			{error ? (
				<ErrorAlert
					title="Could not delete user"
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
							title="No users Found"
							description="Either there are no users in the database or you have filtered them out."
							icon={UserIcon}
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
				title="Delete user?"
				description={`This will permanently delete "${deleteTarget?.name}" (${deleteTarget?.email}). This action cannot be undone.`}
				actionLabel="Delete"
				onAction={handleConfirm}
				isPending={isPending}
			/>
		</div>
	);
}
