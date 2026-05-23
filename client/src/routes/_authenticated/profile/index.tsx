import { ProfileOverview } from "@/features/profile/components/profile-overview";
import { countUserReviewsQueryOptions } from "@/features/reviews";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProfileOverviewPending } from "./-profile-pending";

export const Route = createFileRoute("/_authenticated/profile/")({
	loader: async ({ context }) => {
		await context.client.ensureQueryData(
			countUserReviewsQueryOptions(context.user.id),
		);
	},
	component: RouteComponent,
	pendingComponent: ProfileOverviewPending,
});

function RouteComponent() {
	const { user } = Route.useRouteContext();

	const reviewsCountQuery = useSuspenseQuery(
		countUserReviewsQueryOptions(user.id),
	);

	return <ProfileOverview user={user} reviewsCount={reviewsCountQuery.data} />;
}
