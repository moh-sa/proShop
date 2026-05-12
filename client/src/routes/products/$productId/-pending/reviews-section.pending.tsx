import { ReviewsListPending } from "./form-list.pending";
import { ReviewFormPending } from "./review-form.pending";

export function ReviewsSectionPending() {
	return (
		<section>
			<div className="mb-6 h-7" aria-hidden />

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="col-span-1 row-2 md:col-span-2 md:row-1">
					<ReviewsListPending />
				</div>

				<div className="col-span-1 row-1">
					<ReviewFormPending />
				</div>
			</div>
		</section>
	);
}
