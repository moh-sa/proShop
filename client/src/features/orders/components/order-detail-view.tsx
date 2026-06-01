import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BackButton, PageHeader } from "@/shared/layout/page";
import { formatDate, getLast8Chars } from "@/shared/utils";
import { useMutation } from "@tanstack/react-query";
import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { getActivePaymentUrl } from "../helpers/get-active-payment-url";
import { cancelOrderMutationOptions } from "../queries/orders.mutations";
import type { Order } from "../types";
import { OrderReceiptCard } from "./order-receipt/order-receipt-card";

type OrderDetailViewProps = {
	order: Order;
	search: Record<string, unknown>;
};

export function OrderDetailView(props: OrderDetailViewProps) {
	const paymentUrl = getActivePaymentUrl(props.order);
	const [cancelOpen, setCancelOpen] = useState(false);
	const cancelMutation = useMutation(cancelOrderMutationOptions);

	return (
		<div className="mx-auto max-w-3xl">
			<header>
				<BackButton
					label="Back to Order History"
					to="/profile/orders"
					search={props.search}
				/>

				<div className="flex items-center justify-between gap-4">
					<PageHeader
						title={`Order #${getLast8Chars(props.order.id)}`}
						description={`Placed on ${formatDate(props.order.createdAt)}`}
					/>

					<div className="flex flex-wrap gap-2">
						{paymentUrl ? (
							<Button
								className="w-full sm:w-auto"
								nativeButton={false}
								render={
									<a
										href={paymentUrl}
										rel="noopener noreferrer"
										target="_blank"
									/>
								}
							>
								Complete Payment
								<ExternalLinkIcon className="size-4" />
							</Button>
						) : null}
						{props.order.status === "pending" ? (
							<Button
								variant="outline"
								className="w-full text-destructive hover:text-destructive sm:w-auto"
								onClick={() => setCancelOpen(true)}
							>
								Cancel Order
							</Button>
						) : null}
					</div>
				</div>
			</header>

			<OrderReceiptCard receipt={props.order}>
				<OrderReceiptCard.Header />
				<OrderReceiptCard.Content>
					<OrderReceiptCard.Items />
					<Separator />
					<OrderReceiptCard.ShippingAddress />
					<Separator />
					<OrderReceiptCard.PriceSummary />
				</OrderReceiptCard.Content>
			</OrderReceiptCard>

			<AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel this order?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently cancel your order. Since refunds are not
							supported, please contact support if you have already paid.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={cancelMutation.isPending} />
						<AlertDialogAction
							disabled={cancelMutation.isPending}
							onClick={() => {
								cancelMutation.mutate(props.order.id, {
									onSuccess: () => setCancelOpen(false),
								});
							}}
						>
							Cancel Order
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
