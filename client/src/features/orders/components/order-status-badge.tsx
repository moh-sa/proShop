import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Order } from "../types";

type OrderStatus = Order["status"];

const STATUS_CONFIG: Record<
	OrderStatus,
	{ label: string; variant: "secondary" | "destructive"; className?: string }
> = {
	pending: {
		label: "Pending",
		variant: "secondary",
		className: "bg-gray-500/10 text-gray-700",
	},
	processing: {
		label: "Processing",
		variant: "secondary",
		className: "bg-amber-500/10 text-amber-800",
	},
	delivered: {
		label: "Delivered",
		variant: "secondary",
		className: "bg-teal-500/10 text-teal-700",
	},
	cancelled: {
		label: "Cancelled",
		variant: "destructive",
	},
};

type OrderStatusBadgeProps = {
	status: OrderStatus;
	className?: string;
};

export function OrderStatusBadge(props: OrderStatusBadgeProps) {
	const config = STATUS_CONFIG[props.status];

	return (
		<Badge
			className={cn(
				"shrink-0 text-xs tracking-wide uppercase",
				config.className,
				props.className,
			)}
			variant={config.variant}
		>
			{config.label}
		</Badge>
	);
}
