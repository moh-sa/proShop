import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Frame, FramePanel } from "@/components/ui/frame";
import { ProductCartControls } from "@/features/cart";
import { productDetailQueryOptions, StarRating } from "@/features/products";
import { formatPrice } from "@/shared/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import { CreditCard, ShieldCheck, Truck } from "lucide-react";

const routeApi = getRouteApi("/products/$productId/");

export function ProductDetailSection() {
	const { productId } = routeApi.useParams();
	const { data: product } = useSuspenseQuery(
		productDetailQueryOptions(productId),
	);
	const inStock = product.countInStock > 0;

	return (
		<Frame className="grid w-full grid-cols-1 gap-2 md:grid-cols-2">
			<div className="aspect-square overflow-hidden rounded-xl bg-muted md:sticky md:top-20">
				<img
					src={product.image}
					alt={product.name}
					width={700}
					height={700}
					className="h-full w-full object-cover"
				/>
			</div>

			<FramePanel className="flex flex-col p-4">
				<div className="mb-4 flex items-center justify-between gap-4">
					<Badge
						variant="secondary"
						className="px-2 py-1 text-sm font-medium text-primary"
						render={<Link to="/search" search={{ keyword: product.brand }} />}
					>
						{product.brand}
					</Badge>
					<StarRating
						rating={product.rating}
						reviewCount={product.numReviews}
						showReviewsCount
					/>
				</div>

				<h1 className="mb-2 text-3xl font-bold">{product.name}</h1>

				<div className="mb-6">
					<span className="text-2xl font-bold">
						{formatPrice(product.price)}
					</span>
				</div>

				<div className="mb-4 grid grid-cols-2 gap-2 self-center">
					{inStock ? <StockIndicator inStock /> : <StockIndicator />}
					<ProductFeatures />
				</div>

				<div className="mb-8">
					{inStock ? (
						<ProductCartControls item={product} />
					) : (
						<OutOfStockAlert />
					)}
				</div>

				<p className="max-w-prose text-muted-foreground">
					{product.description}
				</p>
			</FramePanel>
		</Frame>
	);
}

function OutOfStockAlert() {
	return (
		<Alert>
			<AlertTitle>Out of Stock</AlertTitle>
			<AlertDescription>
				This product is temporarily out of stock. Please check back later.
			</AlertDescription>
		</Alert>
	);
}

function StockIndicator({ inStock = false }: { inStock?: boolean }) {
	const dotColor = inStock ? "bg-green-500" : "bg-red-500";
	return (
		<div className="flex items-center gap-2 text-sm">
			<div className={`mx-1 size-2 rounded-full ${dotColor}`} />
			<span>{inStock ? "In Stock" : "Out of Stock"}</span>
		</div>
	);
}

const PRODUCT_FEATURES = [
	{ Icon: Truck, label: "Free Shipping" },
	{ Icon: CreditCard, label: "Secure Payment" },
	{ Icon: ShieldCheck, label: "2 Years Warranty" },
] as const;

function ProductFeatures() {
	return PRODUCT_FEATURES.map(({ Icon, label }) => (
		<div key={label} className="flex items-center gap-2 text-sm">
			<Icon className="size-4" aria-hidden="true" />
			<span>{label}</span>
		</div>
	));
}
