import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ShoppingCartIcon } from "lucide-react";
import { selectTotalQuantity, useCartStore } from "../stores";

export function CartButton() {
	return (
		<div className="relative">
			<Button nativeButton={false} render={<Link to="/cart" />} variant="ghost">
				<ShoppingCartIcon className="size-4" />
				Cart
			</Button>
			<QuantityBadge />
		</div>
	);
}

function QuantityBadge() {
	const totalQuantity = useCartStore(selectTotalQuantity);
	if (totalQuantity === 0) return null;

	return (
		<Badge className="pointer-events-none absolute -top-2 -right-2 h-4 min-w-4 text-xs tabular-nums">
			{totalQuantity}
		</Badge>
	);
}
