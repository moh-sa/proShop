import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/shared/utils";
import * as React from "react";
import type { Order } from "../../types";
import { OrderStatusBadge } from "../order-status-badge";
import { ReceiptLineItem } from "./order-receipt-list-item";
import { TotalRow } from "./total-row";

type OrderReceiptContextValue = {
	receipt: Order;
};

const OrderReceiptContext =
	React.createContext<OrderReceiptContextValue | null>(null);

function useOrderReceiptContext() {
	const ctx = React.useContext(OrderReceiptContext);
	if (!ctx) throw new Error("Must be used inside <OrderReceiptCard>");
	return ctx;
}

type OrderReceiptCardRootProps = {
	receipt: Order;
	children: React.ReactNode;
};

function OrderReceiptCardRoot({
	receipt,
	children,
}: OrderReceiptCardRootProps) {
	return (
		<OrderReceiptContext.Provider value={{ receipt }}>
			<Card>{children}</Card>
		</OrderReceiptContext.Provider>
	);
}

function Header() {
	const { receipt } = useOrderReceiptContext();

	return (
		<CardHeader className="border-b border-border/60 pb-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<CardTitle className="font-heading text-lg tracking-tight">
					Order Details
				</CardTitle>
				<OrderStatusBadge status={receipt.status} />
			</div>
			<p className="pt-2 text-xs tracking-wide text-muted-foreground uppercase">
				Order ID
				<span className="mt-0.5 block font-mono text-sm font-medium tracking-normal text-foreground normal-case tabular-nums">
					{receipt.id}
				</span>
			</p>
		</CardHeader>
	);
}

function Content({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<CardContent className={cn("space-y-6", className)}>{children}</CardContent>
	);
}

function UserDetails() {
	const { receipt } = useOrderReceiptContext();
	const user = receipt.user;

	return (
		<div className="space-y-3">
			<h2 className="text-sm tracking-wide text-muted-foreground uppercase">
				Customer
			</h2>
			<dl className="space-y-2">
				<div>
					<dt className="text-xs text-muted-foreground uppercase">ID</dt>
					<dd className="font-mono text-sm text-foreground">{user.id}</dd>
				</div>

				<div>
					<dt className="text-xs text-muted-foreground uppercase">Name</dt>
					<dd className="text-sm text-foreground">{user.name}</dd>
				</div>

				<div>
					<dt className="text-xs text-muted-foreground uppercase">Email</dt>
					<dd className="text-sm text-foreground">{user.email}</dd>
				</div>
			</dl>
		</div>
	);
}

function Items() {
	const { receipt } = useOrderReceiptContext();
	return (
		<section>
			<h2 className="mb-3 text-sm font-medium tracking-wider text-muted-foreground uppercase">
				Items
			</h2>
			<ul className="divide-y divide-border/50">
				{receipt.orderItems.map((item) => (
					<li key={item.productId}>
						<ReceiptLineItem item={item} />
					</li>
				))}
			</ul>
		</section>
	);
}

function ShippingAddress() {
	const { receipt } = useOrderReceiptContext();
	const addr = receipt.shippingAddress;

	return (
		<section className="text-sm">
			<h2 className="mb-2 text-sm font-medium tracking-wider text-muted-foreground uppercase">
				Ship to
			</h2>
			<address className="leading-relaxed text-foreground not-italic">
				{addr.address}
				<br />
				{addr.city}, {addr.postalCode}
				<br />
				{addr.country}
			</address>
		</section>
	);
}

function PriceSummary() {
	const { receipt } = useOrderReceiptContext();
	return (
		<section>
			<h2 className="sr-only">Price summary</h2>
			<dl className="space-y-2 text-sm">
				<TotalRow label="Subtotal" value={formatPrice(receipt.itemsPrice)} />
				<TotalRow label="Shipping" value={formatPrice(receipt.shippingPrice)} />
				<TotalRow label="Tax" value={formatPrice(receipt.taxPrice)} />
				<Separator className="my-3" />
				<TotalRow
					label="Total"
					value={formatPrice(receipt.totalPrice)}
					className="text-base font-medium text-foreground"
				/>
			</dl>
		</section>
	);
}

export const OrderReceiptCard = Object.assign(OrderReceiptCardRoot, {
	Header,
	Content,
	UserDetails,
	Items,
	ShippingAddress,
	PriceSummary,
});
