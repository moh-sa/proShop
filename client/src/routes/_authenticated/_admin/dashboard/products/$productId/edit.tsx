import { ProductForm } from "@/features/admin/components";
import { adminProductDetailQueryOptions } from "@/features/admin/queries";
import { adminPaginatedSearchSchema } from "@/features/admin/schemas";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_authenticated/_admin/dashboard/products/$productId/edit",
)({
	validateSearch: adminPaginatedSearchSchema,
	async loader({ context, params }) {
		await context.client.ensureQueryData(
			adminProductDetailQueryOptions(params.productId),
		);
	},
	component: EditProductPage,
});

function EditProductPage() {
	const search = Route.useSearch();
	const { productId } = Route.useParams();
	const { data: product } = useSuspenseQuery(
		adminProductDetailQueryOptions(productId),
	);

	return <ProductForm mode="edit" product={product} search={search} />;
}
