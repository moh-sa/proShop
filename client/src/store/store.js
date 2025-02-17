import { configureStore } from "@reduxjs/toolkit";
import auth from "./auth/auth.slice";
import cart from "./cart/cart.slice";
import orders from "./orders/orders.slice";
import products from "./products/products.slice";
import reviews from "./reviews/review.slice";
import users from "./users/users.slice";

const reducers = {
  auth,
  cart,
  orders,
  products,
  users,
  reviews,
};

const store = configureStore({
  reducer: reducers,
  devTools: import.meta.env.DEV,
});

export default store;
