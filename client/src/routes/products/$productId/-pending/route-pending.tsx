import { ProductSectionPending } from "./product-section.pending";
import { ReviewsSectionPending } from "./reviews-section.pending";

export function ProductRoutePending() {
	return (
		<div className="mx-auto max-w-6xl space-y-10">
			<ProductSectionPending />
			<ReviewsSectionPending />
		</div>
	);
}
