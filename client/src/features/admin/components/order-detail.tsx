import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/confirm-alert-dialog";
import { Separator } from "@/components/ui/separator";
import { OrderReceiptCard } from "@/features/orders/components";
import type { Order } from "@/features/orders/types";
import {
	adminCancelOrderMutationOptions,
	markAsDeliveredMutationOptions,
} from "@/features/admin/queries";
import { useDisclosure } from "@/shared/hooks";
import { BackButton, PageHeader } from "@/shared/layout/page";
import { getLast8Chars } from "@/shared/utils";
import { useMutation } from "@tanstack/react-query";

type AdminOrderDetailProps = {
	order: Order;
	search: Record<string, unknown>;
};

export function AdminOrderDetail(props: AdminOrderDetailProps) {
	const deliverDialog = useDisclosure();
	const cancelDialog = useDisclosure();
	const deliverMutation = useMutation(markAsDeliveredMutationOptions);
	const cancelMutation = useMutation(adminCancelOrderMutationOptions);
	const isPending = deliverMutation.isPending || cancelMutation.isPending;

	function handleMarkAsDelivered() {
		deliverMutation.mutate(props.order.id, {
			onSuccess: () => deliverDialog.onClose(),
		});
	}

	function handleCancelOrder() {
		cancelMutation.mutate(props.order.id, {
			onSuccess: () => cancelDialog.onClose(),
		});
	}

	const headerActions =
		props.order.status === "processing" ? (
			<Button
				variant="outline"
				onClick={deliverDialog.onOpen}
				disabled={isPending}
			>
				Mark as Delivered
			</Button>
		) : props.order.status === "pending" ? (
			<Button
				variant="outline"
				onClick={cancelDialog.onOpen}
				disabled={isPending}
				className="text-destructive hover:text-destructive"
			>
				Cancel Order
			</Button>
		) : undefined;

	return (
		<div>
			<BackButton
				label="Back to Orders"
				to="/dashboard/orders"
				search={props.search}
			/>

			<PageHeader
				title={`Order #${getLast8Chars(props.order.id)}`}
				actions={headerActions}
			/>

			<OrderReceiptCard receipt={props.order}>
				<OrderReceiptCard.Header />
				<OrderReceiptCard.Content>
					<OrderReceiptCard.UserDetails />
					<Separator />
					<OrderReceiptCard.Items />
					<Separator />
					<OrderReceiptCard.ShippingAddress />
					<Separator />
					<OrderReceiptCard.PriceSummary />
				</OrderReceiptCard.Content>
			</OrderReceiptCard>

			<ConfirmAlertDialog
				title="Mark as delivered?"
				description="This will update the order status to 'delivered' and set the delivery timestamp."
				isOpen={deliverDialog.isOpen}
				isPending={isPending}
				actionLabel="Confirm"
				onOpenChange={deliverDialog.setIsOpen}
				onAction={handleMarkAsDelivered}
			/>

			<ConfirmAlertDialog
				title="Cancel order?"
				description="This will permanently cancel this order. Since refunds are not supported yet, please handle any payment manually."
				isOpen={cancelDialog.isOpen}
				isPending={isPending}
				actionLabel="Cancel Order"
				onOpenChange={cancelDialog.setIsOpen}
				onAction={handleCancelOrder}
			/>
		</div>
	);
}
