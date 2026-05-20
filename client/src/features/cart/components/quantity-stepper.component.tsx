import { Button } from "@/components/ui/button";
import { selectQuantityByProductId, useCartStore } from "@/features/cart";
import { Minus, Plus, Trash2 } from "lucide-react";

type QuantityStepperProps = {
	productId: string;
	maxQuantity: number;
};

export function QuantityStepper(props: QuantityStepperProps) {
	const quantity = useCartStore(selectQuantityByProductId(props.productId));
	const increase = useCartStore((s) => s.increase);
	const decrease = useCartStore((s) => s.decrease);

	if (quantity === 0) return null;

	return (
		<div className="flex grow items-center justify-center gap-1 rounded-lg bg-background p-0.5 text-foreground ring-1 ring-gray-100">
			<Button
				variant="ghost"
				size="icon"
				className="min-w-0 flex-1 rounded-lg"
				onClick={() => decrease(props.productId)}
			>
				{quantity > 1 ? (
					<Minus className="size-4" />
				) : (
					<Trash2 className="size-4 text-destructive" />
				)}
			</Button>

			<span className="min-w-0 flex-1 text-center text-sm font-medium tabular-nums">
				{quantity}
			</span>

			<Button
				variant="ghost"
				size="icon"
				className="min-w-0 flex-1 rounded-lg"
				onClick={() => increase(props.productId)}
				disabled={quantity === props.maxQuantity}
			>
				<Plus className="size-4" />
			</Button>
		</div>
	);
}
