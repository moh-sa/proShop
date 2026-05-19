import { selectSubtotal, useCartStore } from "@/features/cart";
import { calculateOrderPricing } from "@/features/orders/helpers";
import { toOrderItems } from "@/features/orders/helpers/to-order-items.helper";
import { createOrderMutationOptions } from "@/features/orders/queries";
import { useAppForm } from "@/shared/form";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import type { ShippingAddress } from "../types";

export function useCheckout() {
	const paymentDialog = usePaymentDialog();

	const mutation = useMutation(createOrderMutationOptions);

	const form = useAppForm({
		defaultValues: {
			address: "",
			city: "",
			postalCode: "",
			country: "",
		},
		onSubmit: async ({ value }) => {
			await createOrder(value);
		},
	});

	async function createOrder(shippingAddress: ShippingAddress) {
		const state = useCartStore.getState();
		const summary = calculateOrderPricing(selectSubtotal(state));
		const orderItems = toOrderItems(Object.values(state.items));

		try {
			await mutation.mutateAsync(
				{
					shippingPrice: summary.shippingPrice,
					taxPrice: summary.taxPrice,
					totalPrice: summary.totalPrice,
					itemsPrice: summary.subtotal,
					orderItems,
					shippingAddress,
				},
				{
					onSuccess: (response) => {
						paymentDialog.onOpen(response.session.url);
					},
				},
			);
		} catch {
			// mutation.isError handles the UI feedback
		}
	}

	return {
		form,
		mutation,
		dialog: {
			isOpen: paymentDialog.isOpen,
			onConfirm: paymentDialog.onConfirm,
			onCancel: paymentDialog.onCancel,
		},
	};
}

function usePaymentDialog() {
	const [isOpen, setIsOpen] = React.useState(false);
	const paymentRedirectUrl = React.useRef<string | null>(null);

	function onOpen(url: string) {
		paymentRedirectUrl.current = url;
		setIsOpen(true);
	}

	function onConfirm() {
		setIsOpen(false);
		if (paymentRedirectUrl.current) {
			window.location.assign(paymentRedirectUrl.current);
		}
	}

	function onCancel() {
		setIsOpen(false);
	}

	return { isOpen, onOpen, onConfirm, onCancel };
}
