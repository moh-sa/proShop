import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { REVIEWS_PAGE_SIZE } from "../consts/reviews.consts";
import type { Review } from "../types/reviews.types";
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
			<Frame as="ul" className="divide-y divide-gray-200">
				{props.reviews.map((r) => (
					<FramePanel
						as="li"
						key={r.id}
						className="rounded-none p-3 first:rounded-t-xl last:rounded-b-xl"
					>
						<ReviewCardItem review={r} />
					</FramePanel>
				))}
			</Frame>
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
			<Frame>
				<FramePanel className="divide-y divide-gray-200 overflow-hidden p-0">
					{Array.from({ length: REVIEWS_PAGE_SIZE }).map((_, index) => (
						<Skeleton
							key={index}
							className="min-h-[77px] w-full rounded-none border-0 p-3 shadow-none"
						/>
					))}
				</FramePanel>
			</Frame>
			<Skeleton className="mx-auto min-h-[32px] w-[114px] rounded-md p-2.5" />
		</>
	);
}

function ReviewListEmpty() {
	return (
		<Frame>
			<FramePanel className="px-3 py-4">
				No reviews yet. Be the first to review this product!
			</FramePanel>
		</Frame>
	);
}
