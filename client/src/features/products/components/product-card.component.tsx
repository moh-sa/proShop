import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/shared/utils";
import { Link } from "@tanstack/react-router";
import { StarIcon } from "lucide-react";
import type { ProductListItem } from "../types";

type ProductCardProps = {
	product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
	return (
		<article className="flex h-full flex-col justify-between gap-3 rounded-3xl bg-gray-100 p-3 shadow-sm">
			<div className="relative shrink-0 grow overflow-hidden rounded-xl">
				<img
					src={product.image}
					alt={product.name}
					className="h-96 w-full object-cover"
				/>
				<Badge className="absolute top-4 left-4 border border-gray-300/50 bg-white/80 px-4 py-2 font-medium text-black select-none">
					<span>{product.brand}</span>
				</Badge>

				<Badge className="absolute top-4 right-4 bg-amber-200/80 p-2.5 text-black/80 shadow-sm select-none">
					<StarIcon className="size-4 fill-amber-400" />
					{product.rating}
				</Badge>
			</div>

			<div className="flex h-full shrink grow-0 flex-col justify-between gap-2 rounded-xl bg-gray-300/50 px-3 py-2">
				<h3
					lang="en"
					className="my-auto grow text-2xl font-medium hyphens-auto text-black"
				>
					{/* TODO: replace with product-detail page */}
					<Link to="/">{product.name}</Link>
				</h3>
				<div className="flex shrink gap-1">
					<span className="m-auto rounded-lg bg-gray-100/70 px-2 py-1 text-center font-medium">
						{formatPrice(product.price)}
					</span>
					<Button type="button" size="lg" className="flex-1 font-semibold">
						Add to cart
					</Button>
				</div>
			</div>
		</article>
	);
}
