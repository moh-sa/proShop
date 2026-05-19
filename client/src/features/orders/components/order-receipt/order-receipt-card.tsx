import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/shared/utils";
import type { Order } from "../../types";
import { ReceiptLineItem } from "./order-receipt-list-item";
import { TotalRow } from "./total-row";

type OrderReceiptCardProps = {
	receipt: Order;
	headerExtra?: React.ReactNode;
};

export function OrderReceiptCard(props: OrderReceiptCardProps) {
	const { receipt } = props;
	const addr = receipt.shippingAddress;

	return (
		<Card>
			<CardHeader className="border-b border-border/60 pb-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<CardTitle className="font-heading text-lg tracking-tight">
						Order Details
					</CardTitle>

					{props.headerExtra}
				</div>

				<p className="pt-2 text-xs tracking-wide text-muted-foreground uppercase">
					Order ID
					<span className="mt-0.5 block text-sm font-medium tracking-normal text-foreground normal-case tabular-nums">
						{receipt.id}
					</span>
				</p>
			</CardHeader>

			<CardContent className="space-y-6">
				<section>
					<h2 className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
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

				<Separator />

				<section className="text-sm">
					<h3 className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
						Ship to
					</h3>
					<address className="leading-relaxed text-foreground not-italic">
						{addr.address}
						<br />
						{addr.city}, {addr.postalCode}
						<br />
						{addr.country}
					</address>
				</section>

				<Separator />

				<section>
					<h3 className="sr-only">Price summary</h3>
					<dl className="space-y-2 text-sm">
						<TotalRow
							label="Subtotal"
							value={formatPrice(receipt.itemsPrice)}
						/>
						<TotalRow
							label="Shipping"
							value={formatPrice(receipt.shippingPrice)}
						/>
						<TotalRow label="Tax" value={formatPrice(receipt.taxPrice)} />
						<Separator className="my-3" />
						<TotalRow
							label="Total"
							value={formatPrice(receipt.totalPrice)}
							className="text-base font-medium text-foreground"
						/>
					</dl>
				</section>
			</CardContent>
		</Card>
	);
}
