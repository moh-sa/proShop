import { configureStore } from "@reduxjs/toolkit";
import auth from "./auth/auth.slice";
import cart from "./cart/cart.slice";
import orders from "./orders/orders.slice";
import products from "./products/products.slice";
import users from "./users/users.slice";

const reducers = {
  auth,
  cart,
  orders,
  products,
  users,
};

const store = configureStore({
  reducer: reducers,
  devTools: import.meta.env.DEV,
});

export default store;
