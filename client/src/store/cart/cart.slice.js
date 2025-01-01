import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartItems: [],
  shippingAddress: {},
  paymentMethod: "",
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action) => {
      const payloadItem = action.payload;
      const existItem = state.cartItems.find(
        (cartItem) => cartItem._id === payloadItem._id,
      );

      if (existItem) {
        const newCartItems = state.cartItems.map((cartItem) =>
          cartItem._id === existItem._id
            ? {
                ...cartItem,
                qty: payloadItem.qty,
              }
            : cartItem,
        );
        state.cartItems = newCartItems;
      } else {
        state.cartItems.push(payloadItem);
      }

      localStorage.setItem("cart", JSON.stringify(state));
    },
    removeItem: (state, action) => {
      const newCartItems = state.cartItems.filter(
        (item) => item._id !== action.payload,
      );
      state.cartItems = newCartItems;
      localStorage.setItem("cart", JSON.stringify(state));
    },
    setShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      localStorage.setItem("cart", JSON.stringify(state));
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      localStorage.setItem("cart", JSON.stringify(state));
    },
    clearCart: (state) => (state = initialState),
  },
});

export const {
  addItem,
  removeItem,
  setPaymentMethod,
  setShippingAddress,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
