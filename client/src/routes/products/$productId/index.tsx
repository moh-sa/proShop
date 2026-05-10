import { productDetailQueryOptions } from "@/features/products";
import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailSection } from "./-product-detail";

export const Route = createFileRoute("/products/$productId/")({
	async loader({ context, params }) {
		await context.client.ensureQueryData(
			productDetailQueryOptions(params.productId),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="mx-auto max-w-6xl space-y-10">
			<ProductDetailSection />
		</div>
	);
}
