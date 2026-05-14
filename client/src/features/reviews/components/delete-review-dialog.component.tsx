import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteReviewMutationOptions } from "../queries/reviews.mutations";

export type DeleteReviewDialogProps = {
	reviewId: string;
	productId: string;
	userId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function DeleteReviewDialog(props: DeleteReviewDialogProps) {
	const deleteMutation = useMutation(deleteReviewMutationOptions);

	function handleDelete() {
		deleteMutation.mutate(
			{
				reviewId: props.reviewId,
				productId: props.productId,
				userId: props.userId,
			},
			{
				onError: (err) =>
					toast.error("Failed to delete review", { description: err.message }),
			},
		);
		props.onOpenChange(false);
	}

	return (
		<AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Review</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete this review? This action cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel />
					<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
