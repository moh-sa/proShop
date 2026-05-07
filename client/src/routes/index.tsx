import { HomeLayout } from "@/components/layouts";
import { TopRatedCarousel } from "@/features/carousel";
import { productTopRatedListQueryOptions } from "@/features/products/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	// TODO: use 'paginationParamsSchema' with 'validateSearch'
	// TODO: use 'loaderDeps' to pass the search params to the loader
	loader: async ({ context }) => {
		const topRatedProducts = await context.client.ensureQueryData(
			productTopRatedListQueryOptions,
		);

		return {
			topRated: topRatedProducts,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const data = Route.useLoaderData();

	return (
		<HomeLayout carouselSlot={<TopRatedCarousel products={data.topRated} />} />
	);
}
