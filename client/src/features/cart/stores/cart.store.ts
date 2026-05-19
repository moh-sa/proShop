import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartItemToAdd } from "../types";

type CartStore = {
	items: Record<string, CartItem>;

	addItem: (input: CartItemToAdd) => void;
	removeItem: (productId: string) => void;
	clear: () => void;
	increase: (productId: string) => void;
	decrease: (productId: string) => void;
};

export const useCartStore = create<CartStore>()(
	persist(
		(set) => ({
			items: {},

			addItem: (input) =>
				set((s) => {
					// check if out of stock or item already exists
					if (input.countInStock <= 0 || s.items[input.id]) return s;

					return {
						items: {
							...s.items,
							[input.id]: {
								...input,
								quantity: 1,
							},
						},
					};
				}),

			removeItem: (productId) =>
				set((s) => ({ items: withoutKey(s.items, productId) })),

			increase: (productId) =>
				set((s) => {
					const item = s.items[productId];

					if (!item) return s; // item not found
					if (item.quantity >= item.countInStock) return s; // item at max quantity

					return {
						items: {
							...s.items,
							[productId]: {
								...item,
								quantity: item.quantity + 1,
							},
						},
					};
				}),

			decrease: (productId) =>
				set((s) => {
					const item = s.items[productId];

					if (!item) return s; // item not found

					return {
						items:
							item.quantity <= 1
								? withoutKey(s.items, productId)
								: {
										...s.items,
										[productId]: {
											...item,
											quantity: item.quantity - 1,
										},
									},
					};
				}),

			clear: () => set({ items: {} }),
		}),
		{
			name: "cart-store",
		},
	),
);

const withoutKey = (items: Record<string, CartItem>, productId: string) => {
	const next = { ...items };
	delete next[productId];
	return next;
};

// selectors
/**
 * Select the quantity of an item by product id. Used with {@link useCartStore} hook.
 * @example
 * ```ts
 * const quantity = useCartStore(selectQuantityByProductId("123"));
 * ```
 *  */
export const selectQuantityByProductId =
	(productId: string) => (state: CartStore) =>
		state.items[productId]?.quantity ?? 0;

/**
 * Select the total quantity of items in the cart. Used with {@link useCartStore} hook.
 * @example
 * ```ts
 * const totalQuantity = useCartStore(selectTotalQuantity);
 * ```
 *  */
export const selectTotalQuantity = (state: CartStore) =>
	Object.values(state.items).reduce((acc, item) => acc + item.quantity, 0);

export const selectSubtotal = (state: CartStore) =>
	Object.values(state.items).reduce(
		(acc, item) => acc + item.price * item.quantity,
		0,
	);
