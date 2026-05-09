import { Pagination } from "@/features/pagination";
import { ProductGrid } from "@/features/products/components";
import { productSearchListQueryOptions } from "@/features/products/queries";
import { productSearchParamsSchema } from "@/features/products/schemas";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/search")({
	validateSearch: productSearchParamsSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) => {
		const paginatedProducts = await context.client.ensureQueryData(
			productSearchListQueryOptions(deps),
		);

		return {
			products: paginatedProducts.data,
			meta: paginatedProducts.meta,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const data = Route.useLoaderData();

	const hasResults = data.products.length > 0;

	const resultsText =
		data.meta.totalItems === 0
			? "No results found"
			: data.meta.totalItems === 1
				? "1 result found"
				: `${data.meta.totalItems} results found`;

	return (
		<div className="flex h-full flex-col gap-8">
			<div>
				<h1 className="text-2xl font-bold">
					Search Results for "{search.keyword}"
				</h1>
				<p className="text-md text-muted-foreground">{resultsText}</p>
			</div>

			{hasResults ? (
				<section className="flex h-full flex-col justify-between">
					<ProductGrid products={data.products} />
					<Pagination {...data.meta} />
				</section>
			) : (
				<div>
					{/* TODO: replace with proper empty state */}
					<p>No results found</p>
				</div>
			)}
		</div>
	);
}
