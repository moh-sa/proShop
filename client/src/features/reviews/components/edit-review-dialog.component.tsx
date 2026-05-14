import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateReviewMutationOptions } from "../queries/reviews.mutations";
import type { CreateReviewInput } from "../types/reviews.types";
import { ReviewForm } from "./review-form.component";

export type EditReviewDialogProps = {
	reviewId: string;
	productId: string;
	rating: number;
	comment: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function EditReviewDialog(props: EditReviewDialogProps) {
	const updateMutation = useMutation(updateReviewMutationOptions);

	async function handleSubmit(values: CreateReviewInput) {
		updateMutation.mutate(
			{
				productId: props.productId,
				reviewId: props.reviewId,
				rating: values.rating,
				comment: values.comment,
			},
			{
				onError: (err) =>
					toast.error("Failed to update review", { description: err.message }),
			},
		);
		props.onOpenChange(false);
	}

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Review</DialogTitle>
				</DialogHeader>

				<ReviewForm
					className="space-y-3"
					initialValues={{
						rating: props.rating,
						comment: props.comment,
					}}
					submitLabel="Save Changes"
					submittingLabel="Saving changes…"
					onSubmit={handleSubmit}
				/>
			</DialogContent>
		</Dialog>
	);
}
