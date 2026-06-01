import { ProductsTable } from "@/features/admin/components";
import { adminProductsQueryOptions } from "@/features/admin/queries";
import { adminPaginatedSearchSchema } from "@/features/admin/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ProductsIndexPending } from "./-index-pending";

export const Route = createFileRoute(
	"/_authenticated/_admin/dashboard/products/",
)({
	validateSearch: adminPaginatedSearchSchema,
	loaderDeps: ({ search }) => search,
	async loader({ context, deps }) {
		await context.client.ensureQueryData(adminProductsQueryOptions(deps));
	},
	component: ProductsPage,
	pendingComponent: ProductsIndexPending,
});

function ProductsPage() {
	const search = Route.useSearch();
	const { data } = useSuspenseQuery(adminProductsQueryOptions(search));

	return <ProductsTable data={data} search={search} />;
}
