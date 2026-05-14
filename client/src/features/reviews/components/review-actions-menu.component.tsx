import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth";
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import type { Review } from "../types/reviews.types";
import { DeleteReviewDialog } from "./delete-review-dialog.component";
import { EditReviewDialog } from "./edit-review-dialog.component";

export type ReviewActionsMenuProps = {
	review: Review;
};

export function ReviewActionsMenu(props: ReviewActionsMenuProps) {
	const { user, isAdmin } = useAuth();
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	if (!user) return null;

	const isAuthor = user.id === props.review.user.id;
	const canEdit = isAuthor;
	const canDelete = isAuthor || isAdmin;

	if (!canEdit && !canDelete) return null;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Review actions"
					className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
				>
					<EllipsisVerticalIcon className="size-4" />
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end">
					{canEdit && (
						<DropdownMenuItem onClick={() => setIsEditOpen(true)}>
							<PencilIcon />
							Edit
						</DropdownMenuItem>
					)}
					{canEdit && canDelete && <DropdownMenuSeparator />}
					{canDelete && (
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setIsDeleteOpen(true)}
						>
							<Trash2Icon />
							Delete
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{canEdit && (
				<EditReviewDialog
					reviewId={props.review.id}
					productId={props.review.productId}
					rating={props.review.rating}
					comment={props.review.comment}
					open={isEditOpen}
					onOpenChange={setIsEditOpen}
				/>
			)}

			{canDelete && (
				<DeleteReviewDialog
					reviewId={props.review.id}
					productId={props.review.productId}
					userId={props.review.user.id}
					open={isDeleteOpen}
					onOpenChange={setIsDeleteOpen}
				/>
			)}
		</>
	);
}
