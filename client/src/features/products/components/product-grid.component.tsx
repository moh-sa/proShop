import type { ProductListItem } from "../types";
import { ProductCard } from "./product-card.component";

type ProductGridProps = {
	products: Array<ProductListItem>;
};

export function ProductGrid({ products }: ProductGridProps) {
	// TODO: add empty state

	return (
		<ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
			{products.map((product) => (
				<li key={product.id}>
					<ProductCard product={product} />
				</li>
			))}
		</ul>
	);
}
