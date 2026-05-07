import { HomeLayout } from "@/components/layouts";

import { TopRatedCarousel } from "@/features/carousel";
import { paginationParamsSchema } from "@/features/pagination";
import { productTopRatedListQueryOptions } from "@/features/products/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	validateSearch: paginationParamsSchema,
	loaderDeps: ({ search }) => search,
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
