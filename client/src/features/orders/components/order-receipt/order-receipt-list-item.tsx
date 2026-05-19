import { formatPrice } from "@/shared/utils";
import type { OrderItem } from "../../types";

type ReceiptLineItemProps = {
	item: OrderItem;
};

export function ReceiptLineItem(props: ReceiptLineItemProps) {
	const { item } = props;
	const lineTotal = item.price * item.qty;

	return (
		<div className="flex gap-3 rounded-lg p-2 pr-3">
			<img
				alt={`${item.name} thumbnail`}
				className="size-18 shrink-0 rounded-md object-cover"
				height={72}
				loading="lazy"
				src={item.image}
				width={72}
			/>
			<div className="min-w-0 flex-1 py-0.5">
				<p className="leading-snug font-medium text-foreground">{item.name}</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					{item.qty} x {formatPrice(item.price)} each
				</p>
			</div>
			<p className="shrink-0 self-center text-sm font-medium text-foreground tabular-nums">
				{formatPrice(lineTotal)}
			</p>
		</div>
	);
}
