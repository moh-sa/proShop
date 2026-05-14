import { Pagination } from "@/features/pagination";
import { ProductGrid } from "@/features/products/components";
import { productSearchListQueryOptions } from "@/features/products/queries";
import { productSearchParamsSchema } from "@/features/products/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SearchRoutePending } from "./-search-pending";

export const Route = createFileRoute("/search")({
	validateSearch: productSearchParamsSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) =>
		await context.client.ensureQueryData(productSearchListQueryOptions(deps)),
	component: RouteComponent,
	pendingComponent: SearchRoutePending,
});

function RouteComponent() {
	const search = Route.useSearch();
	const {
		data: { data: products, meta },
	} = useSuspenseQuery(productSearchListQueryOptions(search));

	const hasResults = products.length > 0;

	const resultsText =
		meta.totalItems === 0
			? "No results found"
			: meta.totalItems === 1
				? "1 result found"
				: `${meta.totalItems} results found`;

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
					<ProductGrid products={products} />
					<Pagination {...meta} />
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
