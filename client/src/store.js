import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import { createStore, combineReducers, applyMiddleware } from "redux";

import {
  productListReducer,
  productDetailsReducer,
  productDeleteReducer,
  productCreateReducer,
  productUpdateReducer,
  productReviewCreateReducer,
} from "./reducers/productReducers";
import { cartReducer } from "./reducers/cartReducers";
import {
  userLoginReducer,
  userRegisterReducer,
  userDetailsReducer,
  userUpdateProfileReducer,
  userListReducer,
  userDeleteReducer,
  userUpdateReducer,
} from "./reducers/userReducers";
import {
  orderCreateReducer,
  orderDetailsReducer,
  orderPayReducer,
  orderMyListReducer,
  orderListReducer,
  orderDeliverReducer,
} from "./reducers/orderReducers";

const reducer = combineReducers({
  productList: productListReducer,
  productDetails: productDetailsReducer,
  cart: cartReducer,
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  userDetails: userDetailsReducer,
  userUpdateProfile: userUpdateProfileReducer,
  orderCreate: orderCreateReducer,
  orderDetails: orderDetailsReducer,
  orderPay: orderPayReducer,
  orderMyList: orderMyListReducer,
  userList: userListReducer,
  userDelete: userDeleteReducer,
  userUpdate: userUpdateReducer,
  productDelete: productDeleteReducer,
  productCreate: productCreateReducer,
  productUpdate: productUpdateReducer,
  orderList: orderListReducer,
  orderDeliver: orderDeliverReducer,
  productReviewCreate: productReviewCreateReducer,
});

const cartItemsLocalStorage = localStorage.getItem("cartItems");
const CheckCartItemsLS = cartItemsLocalStorage
  ? JSON.parse(cartItemsLocalStorage)
  : [];

const userInfoLocalStorage = localStorage.getItem("userInfo");
const CheckUserInfoLS = userInfoLocalStorage
  ? JSON.parse(userInfoLocalStorage)
  : null;

const shippingAddressLocalStorage = localStorage.getItem("shippingAddress");
const CheckShippingAddressLS = shippingAddressLocalStorage
  ? JSON.parse(shippingAddressLocalStorage)
  : {};

const paymentMethodLocalStorage = localStorage.getItem("paymentMethod");
const CheckPaymentMethodLS = paymentMethodLocalStorage
  ? JSON.parse(paymentMethodLocalStorage)
  : {};

const initialState = {
  cart: {
    cartItems: CheckCartItemsLS,
    shippingAddress: CheckShippingAddressLS,
    paymentMethod: CheckPaymentMethodLS,
  },
  userLogin: { userInfo: CheckUserInfoLS },
};

const middlewares = [thunk];

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middlewares))
);

export default store;
