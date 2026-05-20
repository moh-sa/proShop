import { cn } from "@/lib/utils";
import type { CartItemToAdd } from "../types";
import { AddToCartButton } from "./add-to-cart-button.component";
import { QuantityStepper } from "./quantity-stepper.component";

type ProductCartControlsProps = {
	item: CartItemToAdd;
	className?: string;
};

export function ProductCartControls(props: ProductCartControlsProps) {
	return (
		<div className={cn("flex", props.className)}>
			<AddToCartButton item={props.item} />
			<QuantityStepper
				productId={props.item.id}
				maxQuantity={props.item.countInStock}
			/>
		</div>
	);
}
