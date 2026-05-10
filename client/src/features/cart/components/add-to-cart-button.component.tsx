import { Button } from "@/components/ui/button";
import { selectQuantityByProductId, useCartStore } from "../stores";
import type { CartItemToAdd } from "../types";

type AddToCartButtonProps = CartItemToAdd;

export function AddToCartButton(props: AddToCartButtonProps) {
	const quantity = useCartStore(selectQuantityByProductId(props.id));
	const addItem = useCartStore((s) => s.addItem);

	if (quantity > 0) return null;

	function handleAddToCart() {
		addItem({
			id: props.id,
			name: props.name,
			price: props.price,
			image: props.image,
			countInStock: props.countInStock,
		});
	}

	return (
		<Button size="lg" className="grow font-semibold" onClick={handleAddToCart}>
			Add to Cart
		</Button>
	);
}
