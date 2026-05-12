import { formatDate } from "@/shared/utils";
import { cn } from "@/lib/utils";
import type { Review } from "../types/reviews.types";
import { StarRatingList } from "./star-rating-list.component";

export type ReviewCardItemProps = {
	className?: string;
	review: Review;
};

export function ReviewCardItem(props: ReviewCardItemProps) {
	return (
		<div className={cn("bg-white p-2", props.className)}>
			<div className="flex flex-col">
				<span className="text-sm font-semibold">{props.review.user.name}</span>
				<div className="flex items-center gap-2">
					<StarRatingList rating={props.review.rating} />
					<span className="text-sm text-muted-foreground">
						Reviewed on {formatDate(props.review.createdAt)}
					</span>
				</div>
			</div>
			<p className="text-sm text-muted-foreground">{props.review.comment}</p>
		</div>
	);
}
