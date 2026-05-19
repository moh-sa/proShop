import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function EmptyCart() {
	return (
		<div className="py-20 text-center">
			<h1 className="mb-4 text-2xl font-bold">Your cart is empty</h1>
			<p className="mb-6 text-muted-foreground">
				Add some products to get started.
			</p>
			<Button nativeButton={false} render={<Link to="/" />}>
				Browse Products
			</Button>
		</div>
	);
}
