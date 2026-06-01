import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/features/users/types";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon } from "lucide-react";

type UserColumnsParams = {
	search: Record<string, unknown>;
	onDeleteClick: (user: User) => void;
};

export function getUserColumns(
	params: UserColumnsParams,
): Array<ColumnDef<User>> {
	return [
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => (
				<span
					title={row.original.name}
					className="block max-w-[22ch] truncate font-medium"
				>
					{row.original.name}
				</span>
			),
		},
		{
			accessorKey: "email",
			header: "Email",
			cell: ({ row }) => (
				<span
					title={row.original.email}
					className="block max-w-[22ch] truncate"
				>
					{row.original.email}
				</span>
			),
		},
		{
			accessorKey: "isAdmin",
			header: "Role",
			cell: ({ row }) =>
				row.original.isAdmin ? (
					<Badge variant="default">Admin</Badge>
				) : (
					<span className="text-xs">Customer</span>
				),
		},
		{
			accessorKey: "createdAt",
			header: "Joined",
			cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
		},
		{
			id: "actions",
			header: () => <div className="text-right">Actions</div>,
			cell: ({ row }) => (
				<div className="flex justify-end gap-2">
					<Button
						variant="secondary"
						size="sm"
						nativeButton={false}
						render={
							<Link
								to="/dashboard/users/$userId/edit"
								params={{ userId: row.original.id }}
								search={params.search}
							/>
						}
					>
						<PencilIcon className="size-4" />
						Edit
					</Button>
					<Button
						variant="destructive"
						size="sm"
						className="text-end"
						onClick={() => params.onDeleteClick(row.original)}
					>
						<TrashIcon className="size-4" />
						Delete
					</Button>
				</div>
			),
		},
	];
}
