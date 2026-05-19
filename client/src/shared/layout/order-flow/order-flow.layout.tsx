import { OrderSummary } from "./order-summary.component";

type OrderLayoutProps = {
	children: React.ReactNode;
	actionSlot: React.ReactNode;
};

/**
 * wrapper for the `/cart` and `/checkout` routes
 *
 * @example
 * ```tsx
 * <OrderLayout actionSlot={<Button>Checkout</Button>}>
 *   {children}
 * </OrderLayout>
 * ```
 */
export function OrderLayout(props: OrderLayoutProps) {
	return (
		<div className="mx-auto w-full max-w-5xl">
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				{/* ORDER CONTENT */}
				<div className="lg:col-span-2">{props.children}</div>
				{/* ORDER SUMMARY */}
				<div className="lg:col-span-1">
					<OrderSummary actionSlot={props.actionSlot} />
				</div>
			</div>
		</div>
	);
}
