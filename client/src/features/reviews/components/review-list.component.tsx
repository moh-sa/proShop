import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { REVIEWS_PAGE_SIZE } from "../consts/reviews.consts";
import type { Review } from "../types/reviews.types";
import { ReviewCard } from "./review-card.component";
import { ReviewCardItem } from "./review-card-item.component";

export type ReviewListProps = {
	reviews: Array<Review>;
	isFetching: boolean;
	isFetchingNextPage: boolean;
	hasNextPage: boolean;
	onLoadMore: () => void;
};

export function ReviewList(props: ReviewListProps) {
	const isInitialLoading = props.isFetching && !props.isFetchingNextPage;
	if (isInitialLoading) {
		return <ReviewListSkeleton />;
	}

	if (!props.reviews || props.reviews.length === 0) {
		return <ReviewListEmpty />;
	}

	return (
		<div className="flex flex-col gap-2">
			<ReviewCard className="divide-y divide-gray-200 [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md">
				{props.reviews.map((review) => (
					<ReviewCardItem key={review.id} review={review} />
				))}
			</ReviewCard>
			{props.hasNextPage ? (
				<Button
					variant="outline"
					onClick={props.onLoadMore}
					disabled={props.isFetchingNextPage}
					className="mx-auto"
				>
					{props.isFetchingNextPage ? (
						<>
							<Spinner />
							Loading…
						</>
					) : (
						"More Reviews"
					)}
				</Button>
			) : null}
		</div>
	);
}

function ReviewListSkeleton() {
	return (
		<>
			<ReviewCard className="divide-y divide-gray-200 [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md">
				{Array.from({ length: REVIEWS_PAGE_SIZE }).map((_, index) => (
					<Skeleton key={index} className="min-h-[77px] w-full bg-white p-2" />
				))}
			</ReviewCard>
			<Skeleton className="mx-auto min-h-[32px] w-[114px] rounded-md p-2.5" />
		</>
	);
}

function ReviewListEmpty() {
	return (
		<ReviewCard>
			<div className="bg-white px-3 py-4">
				No reviews yet. Be the first to review this product!
			</div>
		</ReviewCard>
	);
}
