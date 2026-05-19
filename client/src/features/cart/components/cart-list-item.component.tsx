import { Button } from "@/components/ui/button";
import { formatPrice } from "@/shared/utils";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import type { CartItem } from "../types";
import { QuantityStepper } from "./quantity-stepper.component";

type CartListItemProps = {
	item: CartItem;
	onRemove: (productId: string) => void;
};

export function CartListItem(props: CartListItemProps) {
	return (
		<div className="flex flex-row gap-2">
			<div className="size-20 min-w-0 shrink-0 overflow-hidden rounded-md">
				<img
					src={props.item.image}
					alt={`${props.item.name} thumbnail`}
					className="size-20 object-cover"
					height={80}
					width={80}
				/>
			</div>

			<div className="flex w-full min-w-0 flex-col justify-between gap-2">
				<div className="flex justify-between">
					<h3 className="font-medium">
						<Link
							to="/products/$productId"
							params={{ productId: props.item.id }}
						>
							{props.item.name}
						</Link>
					</h3>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => props.onRemove(props.item.id)}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>

				<div className="flex items-center justify-between">
					<div className="w-32">
						<QuantityStepper
							productId={props.item.id}
							maxQuantity={props.item.countInStock}
						/>
					</div>
					<p className="me-2 text-right font-semibold">
						{formatPrice(props.item.price * props.item.quantity)}
					</p>
				</div>
			</div>
		</div>
	);
}
