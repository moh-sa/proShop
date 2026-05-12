import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton, useAuth } from "@/features/auth";
import {
	createReviewMutationOptions,
	hasReviewedProductQueryOptions,
	productReviewsListQueryOptions,
	ReviewForm,
	ReviewList,
	type CreateReviewInput,
} from "@/features/reviews";
import type { User } from "@/features/users";
import {
	useMutation,
	useSuspenseInfiniteQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Suspense } from "react";

const routeApi = getRouteApi("/products/$productId/");

export function ReviewSection() {
	const { productId } = routeApi.useParams();

	return (
		<section>
			<h2 className="mb-6 text-xl font-semibold">Customer Reviews</h2>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="col-span-1 row-2 md:col-span-2 md:row-1">
					<Suspense fallback={<ReviewsListPending />}>
						<ReviewListContainer productId={productId} />
					</Suspense>
				</div>

				<div className="col-span-1 row-1 space-y-2">
					<ReviewFormPanel productId={productId} />
				</div>
			</div>
		</section>
	);
}

function ReviewListContainer({ productId }: { productId: string }) {
	const reviewsListQuery = useSuspenseInfiniteQuery(
		productReviewsListQueryOptions(productId),
	);

	const reviews = reviewsListQuery.data.pages.flatMap((page) => page.data);

	return (
		<ReviewList
			reviews={reviews}
			onLoadMore={reviewsListQuery.fetchNextPage}
			hasNextPage={reviewsListQuery.hasNextPage}
			isFetching={reviewsListQuery.isFetching}
			isFetchingNextPage={reviewsListQuery.isFetchingNextPage}
		/>
	);
}

export function ReviewsListPending() {
	return (
		<Skeleton className="min-h-[280px] w-full rounded-xl md:min-h-[320px]" />
	);
}

function HasReviewedProductAlert() {
	return (
		<Alert>
			<AlertTitle>Thanks for your review!</AlertTitle>
			<AlertDescription>
				You've already reviewed this item. Shoppers appreciate your feedback!
			</AlertDescription>
		</Alert>
	);
}

function FailedToSubmitReviewAlert(props: { description: string }) {
	return (
		<Alert variant="destructive">
			<AlertTitle>Failed to submit review</AlertTitle>
			<AlertDescription>{props.description}</AlertDescription>
		</Alert>
	);
}

function SignInToReviewAlert() {
	return (
		<Alert>
			<AlertTitle>Share your experience</AlertTitle>
			<AlertDescription>
				Sign in to help other shoppers choose wisely.
			</AlertDescription>
			<AlertAction className="translate-y-1/2">
				<SignInButton />
			</AlertAction>
		</Alert>
	);
}

function ReviewFormPanel(props: { productId: string }) {
	const { user } = useAuth();
	if (!user) return <SignInToReviewAlert />;

	return (
		// '224px' is the current height of the review form
		<Suspense fallback={<Skeleton className="size-full min-h-[224px]" />}>
			<AuthenticatedReviewPanel productId={props.productId} user={user} />
		</Suspense>
	);
}

function AuthenticatedReviewPanel({
	productId,
	user,
}: {
	productId: string;
	user: User;
}) {
	const reviewMutation = useMutation(createReviewMutationOptions);
	const reviewExistsQuery = useSuspenseQuery(
		hasReviewedProductQueryOptions(user.id, productId),
	);

	if (reviewExistsQuery.data === true) {
		return <HasReviewedProductAlert />;
	}

	async function handleReviewCreate(values: CreateReviewInput) {
		try {
			await reviewMutation.mutateAsync({
				rating: values.rating,
				comment: values.comment,
				user: {
					id: user.id,
					name: user.name,
				},
				productId,
			});
		} catch (error) {
			console.error(error);
		}
	}

	return (
		<>
			{reviewMutation.isError ? (
				<FailedToSubmitReviewAlert description={reviewMutation.error.message} />
			) : null}
			<h3 className="mb-4 font-semibold">Write a Review</h3>
			<ReviewForm className="space-y-2" onSubmit={handleReviewCreate} />
		</>
	);
}
