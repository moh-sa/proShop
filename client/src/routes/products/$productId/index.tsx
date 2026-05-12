import { authKeys } from "@/features/auth";
import { productDetailQueryOptions } from "@/features/products";
import {
	hasReviewedProductQueryOptions,
	productReviewsListQueryOptions,
} from "@/features/reviews";
import type { User } from "@/features/users";
import { createFileRoute } from "@tanstack/react-router";
import { ProductRoutePending } from "./-pending/route-pending";
import { ProductDetailSection } from "./-product-detail";
import { ReviewSection } from "./-reviews-section";

export const Route = createFileRoute("/products/$productId/")({
	async loader({ context, params }) {
		// Prefetch non-critical data without blocking the initial render.
		void context.client.prefetchInfiniteQuery(
			productReviewsListQueryOptions(params.productId),
		);

		const cachedUser = context.client.getQueryData<User>(authKeys.me());
		if (cachedUser) {
			void context.client.prefetchQuery(
				hasReviewedProductQueryOptions(cachedUser.id, params.productId),
			);
		}

		// Wait for the product data needed for the initial render.
		await context.client.ensureQueryData(
			productDetailQueryOptions(params.productId),
		);
	},
	component: RouteComponent,
	pendingComponent: ProductRoutePending,
});

function RouteComponent() {
	return (
		<div className="mx-auto max-w-6xl space-y-10">
			<ProductDetailSection />
			<ReviewSection />
		</div>
	);
}
