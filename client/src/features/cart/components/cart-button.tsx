import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ShoppingCartIcon } from "lucide-react";

export function CartButton() {
	// TODO: update link to /cart
	// TODO: get cart items from `useCart` hook

	return (
		<div className="relative">
			<Button nativeButton={false} render={<Link to="/" />} variant="ghost">
				<ShoppingCartIcon className="size-4" />
				Cart
			</Button>
			<Badge className="pointer-events-none absolute -top-2 -right-2 h-4 min-w-4 text-xs">
				3
			</Badge>
		</div>
	);
}
