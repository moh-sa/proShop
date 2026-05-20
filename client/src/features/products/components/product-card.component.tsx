import { Badge } from "@/components/ui/badge";
import { Frame, FramePanel } from "@/components/ui/frame";
import { ProductCartControls } from "@/features/cart";
import { formatPrice } from "@/shared/utils";
import { Link } from "@tanstack/react-router";
import { StarIcon } from "lucide-react";
import type { ProductListItem } from "../types";

type ProductCardProps = {
	product: ProductListItem;
};

function ProductLink(props: { productId: string; children: React.ReactNode }) {
	return (
		<Link to="/products/$productId" params={{ productId: props.productId }}>
			{props.children}
		</Link>
	);
}

export function ProductCard({ product }: ProductCardProps) {
	const inStock = product.countInStock > 0;

	return (
		<Frame
			as="article"
			className="flex h-full flex-col justify-between gap-3 p-3 shadow-sm"
		>
			<div className="relative shrink-0 grow overflow-hidden rounded-xl">
				<ProductLink productId={product.id}>
					<img
						src={product.image}
						alt={product.name}
						className="h-96 w-full object-cover"
					/>
				</ProductLink>
				<Badge className="absolute top-4 left-4 border border-gray-300/50 bg-white/80 px-4 py-2 font-medium text-black select-none">
					<span>{product.brand}</span>
				</Badge>

				<Badge className="absolute top-4 right-4 bg-amber-200/80 p-2.5 text-black/80 shadow-sm select-none">
					<StarIcon className="size-4 fill-amber-400" />
					{product.rating}
				</Badge>
			</div>

			<FramePanel className="relative flex h-full shrink grow-0 flex-col justify-between gap-2 px-3 py-2">
				<h3 lang="en" className="truncate text-2xl font-medium text-black">
					<ProductLink productId={product.id}>{product.name}</ProductLink>
				</h3>

				<span className="absolute -top-1/3 left-6 inline-flex items-center justify-center rounded-t-lg border border-b-0 border-gray-300/50 bg-white px-8 pt-1.5 text-center font-medium">
					{formatPrice(product.price)}
				</span>

				{inStock ? (
					<ProductCartControls item={product} className="gap-1" />
				) : (
					<p className="m-auto text-sm text-muted-foreground">Out of stock</p>
				)}
			</FramePanel>
		</Frame>
	);
}
