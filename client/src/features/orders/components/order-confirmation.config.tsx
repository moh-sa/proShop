import { Spinner } from "@/components/ui/spinner";
import {
	AlertTriangle,
	CheckCircle2,
	LayoutGrid,
	ListOrdered,
	ShoppingBag,
} from "lucide-react";
import type * as React from "react";

export type OrderConfirmationVariant = "pending" | "success" | "failure";

type ActionConfig = {
	label: string;
	to: string;
	icon: React.ComponentType<{ className?: string }>;
	buttonVariant?: "default" | "outline";
};

type VariantConfig = {
	Icon: React.ComponentType<{ className?: string }>;
	iconWrapperClassName: string;
	heading: string;
	actions: ActionConfig[];
};

export const ORDER_CONFIRMATION_CONFIG: Record<
	OrderConfirmationVariant,
	VariantConfig
> = {
	pending: {
		Icon: Spinner,
		iconWrapperClassName: "bg-gray-500/10 text-gray-700",
		heading: "Just a Moment",
		actions: [
			{ label: "Continue Shopping", to: "/", icon: LayoutGrid },
			{
				label: "View All Orders",
				to: "/profile/orders",
				icon: ListOrdered,
				buttonVariant: "outline",
			},
		],
	},
	success: {
		Icon: CheckCircle2,
		iconWrapperClassName: "bg-teal-500/10 text-teal-700",
		heading: "Order Confirmed!",
		actions: [
			{ label: "Continue Shopping", to: "/", icon: LayoutGrid },
			{
				label: "View All Orders",
				to: "/profile/orders",
				icon: ListOrdered,
				buttonVariant: "outline",
			},
		],
	},
	failure: {
		Icon: AlertTriangle,
		iconWrapperClassName: "bg-red-500/10 text-red-800/80",
		heading: "Payment Didn't Go Through",
		actions: [
			{ label: "Return to Cart", to: "/cart", icon: ShoppingBag },
			{
				label: "Continue Shopping",
				to: "/",
				icon: LayoutGrid,
				buttonVariant: "outline",
			},
		],
	},
};
