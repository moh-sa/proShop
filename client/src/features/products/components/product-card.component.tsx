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

			<FramePanel className="flex h-full shrink grow-0 flex-col justify-between gap-2 px-3 py-2">
				<h3
					lang="en"
					className="my-auto grow text-2xl font-medium hyphens-auto text-black"
				>
					<ProductLink productId={product.id}>{product.name}</ProductLink>
				</h3>
				<div className="flex shrink gap-1">
					<span className="flex items-center justify-center rounded-lg bg-gray-100/70 px-2 py-1 text-center font-medium">
						{formatPrice(product.price)}
					</span>
					<div className="grow">
						{inStock ? (
							<ProductCartControls item={product} className="gap-1" />
						) : (
							<p className="m-auto text-sm text-muted-foreground">
								Out of stock
							</p>
						)}
					</div>
				</div>
			</FramePanel>
		</Frame>
	);
}
