import { Button } from "@/components/ui/button";
import {
	CartList,
	EmptyCart,
	selectTotalQuantity,
	useCartStore,
} from "@/features/cart";
import { OrderLayout } from "@/shared/layout/order-flow";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Handbag } from "lucide-react";

export const Route = createFileRoute("/cart")({
	component: RouteComponent,
});

function RouteComponent() {
	const items = useCartStore((s) => s.items);
	const removeItem = useCartStore((s) => s.removeItem);

	const totalQuantity = useCartStore(selectTotalQuantity);
	if (totalQuantity === 0) {
		return <EmptyCart />;
	}

	return (
		<OrderLayout actionSlot={checkoutActionButton}>
			<div className="space-y-6 lg:col-span-2">
				<div>
					<h1 className="text-2xl font-semibold">Shopping Cart</h1>
					<p className="text-muted-foreground">
						{totalQuantity} items in your cart
					</p>
				</div>

				<CartList items={Object.values(items)} onRemove={removeItem} />
			</div>
		</OrderLayout>
	);
}

const checkoutActionButton = (
	<Button
		className="w-full"
		nativeButton={false}
		render={<Link to="/checkout" />}
	>
		<Handbag className="size-4" />
		Continue to Checkout
	</Button>
);
