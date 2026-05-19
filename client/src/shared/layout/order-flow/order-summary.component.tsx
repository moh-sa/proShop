import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { selectSubtotal, useCartStore } from "@/features/cart";
import { calculateOrderPricing } from "@/features/orders/helpers";
import { formatPrice } from "@/shared/utils";
import { Package, Shield, Truck } from "lucide-react";

type OrderSummaryProps = {
	actionSlot: React.ReactNode;
};

export function OrderSummary(props: OrderSummaryProps) {
	const subtotal = useCartStore(selectSubtotal);
	const { shippingPrice, taxPrice, totalPrice } =
		calculateOrderPricing(subtotal);

	return (
		<div className="md:h-full">
			<Card className="md:sticky md:top-20">
				<CardHeader>
					<CardTitle>Order Summary</CardTitle>
					<CardDescription>Review your order details</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6 px-6">
					<div className="space-y-2">
						<SummaryItem label="Subtotal" value={formatPrice(subtotal)} />
						<SummaryItem label="Shipping" value={formatPrice(shippingPrice)} />
						<SummaryItem label="Tax (15%)" value={formatPrice(taxPrice)} />
						<SummaryItem label="Total" value={formatPrice(totalPrice)} />
					</div>

					<div className="space-y-4 border-t pt-4">
						{FEATURES.map(({ icon, label }) => (
							<FeatureItem key={label} icon={icon} label={label} />
						))}
					</div>

					{props.actionSlot}
				</CardContent>
			</Card>
		</div>
	);
}

const FEATURES = [
	{
		icon: Package,
		label: "Free returns within 30 days",
	},
	{
		icon: Shield,
		label: "Secure payment",
	},
	{
		icon: Truck,
		label: "Fast delivery",
	},
];

type FeatureItemProps = {
	icon: React.ElementType;
	label: string;
};

function FeatureItem(props: FeatureItemProps) {
	return (
		<div className="flex items-center gap-2 text-sm">
			<props.icon className="size-4" />
			<span>{props.label}</span>
		</div>
	);
}

type SummaryItemProps = {
	label: string;
	value: string;
};

function SummaryItem(props: SummaryItemProps) {
	return (
		<div className="flex justify-between text-sm">
			<span>{props.label}</span>
			<span>{props.value}</span>
		</div>
	);
}
