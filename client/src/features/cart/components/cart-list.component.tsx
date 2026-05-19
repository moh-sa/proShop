import { Frame, FramePanel } from "@/components/ui/frame";
import type { CartItem } from "../types";
import { CartListItem } from "./cart-list-item.component";

type CartListProps = {
	items: Array<CartItem>;
	onRemove: (productId: string) => void;
};

export function CartList(props: CartListProps) {
	return (
		<Frame as="ul" className="space-y-4">
			<FramePanel
				as="li"
				className="space-y-4 divide-y divide-border/50 rounded-xl p-3 last:pb-0 [&>div]:pb-4"
			>
				{props.items.map((item) => (
					<CartListItem key={item.id} item={item} onRemove={props.onRemove} />
				))}
			</FramePanel>
		</Frame>
	);
}
