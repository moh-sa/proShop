import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, ImageIcon } from "lucide-react";
import type { LowStockProduct } from "../../schemas";

type LowStockCardProps = {
	products: Array<LowStockProduct>;
};

export function LowStockCard(props: LowStockCardProps) {
	return (
		<Card>
			<CardHeader className="flex items-center justify-between">
				<CardTitle>Low Stock</CardTitle>
				<Button
					variant="ghost"
					size="sm"
					nativeButton={false}
					render={<Link to="/dashboard/products" />}
				>
					View All
					<ChevronRightIcon className="size-4" />
				</Button>
			</CardHeader>
			<CardContent>
				{props.products.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						All products are well stocked.
					</p>
				) : (
					<ul className="divide-y">
						{props.products.map((product) => (
							<li key={product.id} className="py-3">
								<Link
									to="/dashboard/products/$productId/edit"
									params={{ productId: product.id }}
									className="flex items-center gap-3 text-sm hover:underline"
								>
									{product.image ? (
										<img
											src={product.image}
											alt={product.name}
											className="size-9 rounded-md object-cover"
										/>
									) : (
										<div className="flex size-9 items-center justify-center rounded-md bg-muted">
											<ImageIcon className="size-4 text-muted-foreground" />
										</div>
									)}
									<span className="min-w-0 flex-1 truncate font-medium">
										{product.name}
									</span>
									<Badge
										variant={
											product.countInStock === 0 ? "destructive" : "outline"
										}
									>
										{product.countInStock === 0
											? "Out of stock"
											: `${product.countInStock} left`}
									</Badge>
								</Link>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
