import { Button } from "@/components/ui/button";
import { selectQuantityByProductId, useCartStore } from "../stores";
import type { CartItemToAdd } from "../types";

type AddToCartButtonProps = {
	item: CartItemToAdd;
};

export function AddToCartButton(props: AddToCartButtonProps) {
	const quantity = useCartStore(selectQuantityByProductId(props.item.id));
	const addItem = useCartStore((s) => s.addItem);

	if (quantity > 0) return null;

	function handleAddToCart() {
		addItem({
			id: props.item.id,
			name: props.item.name,
			price: props.item.price,
			image: props.item.image,
			countInStock: props.item.countInStock,
		});
	}

	return (
		<Button size="lg" className="grow font-semibold" onClick={handleAddToCart}>
			Add to Cart
		</Button>
	);
}
