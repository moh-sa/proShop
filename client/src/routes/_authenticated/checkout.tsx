import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import { EmptyCart, selectTotalQuantity, useCartStore } from "@/features/cart";
import {
	PaymentSandboxInfoDialog,
	ShippingAddressForm,
} from "@/features/checkout/components";
import { useCheckout } from "@/features/checkout/hooks";
import { ErrorAlert } from "@/shared/errors";
import { OrderLayout } from "@/shared/layout/order-flow";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout")({
	component: RouteComponent,
});

type CheckoutActionButtonProps = {
	onClick: () => void;
	isPending: boolean;
};
function CheckoutActionButton(props: CheckoutActionButtonProps) {
	return (
		<Button
			className="w-full"
			onClick={props.onClick}
			disabled={props.isPending}
		>
			{props.isPending ? (
				<>
					<Spinner />
					<span>Processing...</span>
				</>
			) : (
				<>
					<CreditCard className="size-4" />
					<span>Continue to payment</span>
				</>
			)}
		</Button>
	);
}

function RouteComponent() {
	const { form, mutation, dialog } = useCheckout();

	const totalQuantity = useCartStore(selectTotalQuantity);
	if (totalQuantity === 0) {
		return <EmptyCart />;
	}

	return (
		<OrderLayout
			actionSlot={
				<CheckoutActionButton
					onClick={form.handleSubmit}
					isPending={mutation.isPending}
				/>
			}
		>
			<Frame className="max-w-2xl">
				{mutation.isError ? (
					<ErrorAlert
						title="Could not create order"
						message={mutation.error.message}
						onRetry={form.handleSubmit}
					/>
				) : null}

				<FramePanel className="p-3 pb-3.5">
					<ShippingAddressForm form={form} />
				</FramePanel>
			</Frame>
			<PaymentSandboxInfoDialog
				isOpen={dialog.isOpen}
				onCancel={dialog.onCancel}
				onConfirm={dialog.onConfirm}
			/>
		</OrderLayout>
	);
}
