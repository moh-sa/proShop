import { StarIcon } from "lucide-react";

type StarRatingProps = {
	rating: number;
	reviewCount?: number;
	showReviewsCount?: boolean;
};

export function StarRating(props: StarRatingProps) {
	return (
		<div className="flex items-center gap-1">
			<StarIcon className="size-4 fill-amber-400 text-amber-400" />
			<span className="text-sm font-medium">{props.rating}</span>
			{props.showReviewsCount && (
				<span className="text-sm text-muted-foreground">
					({props.reviewCount} reviews)
				</span>
			)}
		</div>
	);
}
