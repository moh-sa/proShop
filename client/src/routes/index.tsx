import { TopRatedCarousel } from "@/features/carousel";
import { Pagination, paginationParamsSchema } from "@/features/pagination";
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
		<div className="flex h-full flex-col gap-8">
			{/* CAROUSEL SECTION */}
			<section className="h-[25vh] max-h-full w-full md:h-[44vh]">
				<TopRatedCarousel products={data.topRated} />
			</section>

			{/* PRODUCTS SECTION */}
			<section className="flex h-full flex-col justify-between gap-4">
				<ProductGrid products={data.paginated.data} />
				<Pagination {...data.paginated.meta} />
			</section>
		</div>
	);
}
