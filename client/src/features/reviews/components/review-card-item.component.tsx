import { formatDate } from "@/shared/utils";
import type { Review } from "../types/reviews.types";
import { ReviewActionsMenu } from "./review-actions-menu.component";
import { StarRatingList } from "./star-rating-list.component";

export type ReviewCardItemProps = {
	review: Review;
};

export function ReviewCardItem(props: ReviewCardItemProps) {
	return (
		<>
			<div className="flex items-start justify-between gap-2">
				<div className="flex flex-col">
					<span className="text-sm font-semibold">
						{props.review.user.name}
					</span>
					<div className="flex items-center gap-2">
						<StarRatingList rating={props.review.rating} />
						<span className="text-sm text-muted-foreground">
							Reviewed on {formatDate(props.review.createdAt)}
						</span>
					</div>
				</div>

				<ReviewActionsMenu review={props.review} />
			</div>

			<p className="mt-1 text-sm text-muted-foreground">
				{props.review.comment}
			</p>
		</>
	);
}
