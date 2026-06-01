import { ReviewsTable } from "@/features/admin/components";
import { adminReviewsQueryOptions } from "@/features/admin/queries";
import { adminPaginatedSearchSchema } from "@/features/admin/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ReviewsIndexPending } from "./-index-pending";

export const Route = createFileRoute(
	"/_authenticated/_admin/dashboard/reviews/",
)({
	validateSearch: adminPaginatedSearchSchema,
	loaderDeps: ({ search }) => search,
	async loader({ context, deps }) {
		await context.client.ensureQueryData(adminReviewsQueryOptions(deps));
	},
	component: ReviewsPage,
	pendingComponent: ReviewsIndexPending,
});

function ReviewsPage() {
	const search = Route.useSearch();
	const { data } = useSuspenseQuery(adminReviewsQueryOptions(search));

	return <ReviewsTable data={data} search={search} />;
}
