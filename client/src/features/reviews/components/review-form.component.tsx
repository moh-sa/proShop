import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAppForm } from "@/shared/form";
import { createReviewInputSchema } from "../schemas/review.schemas";
import { REVIEW_RATING_OPTIONS } from "../consts/reviews.consts";
import type { CreateReviewInput } from "../types/reviews.types";

export type ReviewFormProps = {
	className?: string;
	initialValues?: CreateReviewInput;
	submitLabel?: string;
	submittingLabel?: string;
	onSubmit: (values: CreateReviewInput) => Promise<void>;
};

export function ReviewForm(props: ReviewFormProps) {
	const submitLabel = props.submitLabel ?? "Submit Review";
	const submittingLabel = props.submittingLabel ?? "Submitting review…";

	const form = useAppForm({
		defaultValues: {
			rating: props.initialValues?.rating ?? 5,
			comment: props.initialValues?.comment ?? "",
		},
		onSubmit: async ({ value }) => {
			await props.onSubmit(value);

			if (!props.initialValues) {
				form.reset();
			}
		},
	});

	return (
		<form
			className={props.className}
			onSubmit={async (e) => {
				e.preventDefault();
				e.stopPropagation();

				await form.handleSubmit();
			}}
		>
			<form.AppField
				name="rating"
				validators={{
					onChange: createReviewInputSchema.shape.rating,
				}}
			>
				{(field) => (
					<field.SelectField
						required
						label="Rating"
						items={REVIEW_RATING_OPTIONS}
						placeholder="Select a rating"
					/>
				)}
			</form.AppField>

			<form.AppField
				name="comment"
				validators={{
					onChange: createReviewInputSchema.shape.comment,
				}}
			>
				{(field) => (
					<field.TextareaField
						label="Review Comment"
						required
						placeholder="Share your experience..."
					/>
				)}
			</form.AppField>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
				children={([canSubmit, isSubmitting]) => (
					<Button type="submit" className="w-full" disabled={!canSubmit}>
						{isSubmitting ? (
							<>
								<Spinner />
								{submittingLabel}
							</>
						) : (
							submitLabel
						)}
					</Button>
				)}
			/>
		</form>
	);
}
