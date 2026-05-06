import { HomeLayout } from "@/components/layouts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	// TODO: use 'paginationParamsSchema' with 'validateSearch'
	// TODO: use 'loaderDeps' to pass the search params to the loader
	// TODO: use 'ensureQueryData' to get/fetch the data from the query
	component: RouteComponent,
});

function RouteComponent() {
	return <HomeLayout />;
}
