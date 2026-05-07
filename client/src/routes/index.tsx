import { HomeLayout } from "@/components/layouts";

import { TopRatedCarousel } from "@/features/carousel";
import { paginationParamsSchema } from "@/features/pagination";
import { ProductGrid } from "@/features/products/components";
import {
	productPaginatedListQueryOptions,
	productTopRatedListQueryOptions,
} from "@/features/products/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	validateSearch: paginationParamsSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) => {
		const paginatedProducts = await context.client.ensureQueryData(
			productPaginatedListQueryOptions(deps),
		);
		const topRatedProducts = await context.client.ensureQueryData(
			productTopRatedListQueryOptions,
		);

		return {
			paginated: paginatedProducts,
			topRated: topRatedProducts,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const data = Route.useLoaderData();

	return (
		<HomeLayout
			carouselSlot={<TopRatedCarousel products={data.topRated} />}
			gridSlot={<ProductGrid products={data.paginated.data} />}
		/>
	);
}
