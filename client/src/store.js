import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import { createStore, combineReducers, applyMiddleware } from "redux";

import {
  productListReducer,
  productDetailsReducer,
} from "./reducers/productReducers";
import { cartReducer } from "./reducers/cartReducers";
import { userLoginReducer } from "./reducers/userReducers";

const reducer = combineReducers({
  productList: productListReducer,
  productDetails: productDetailsReducer,
  cart: cartReducer,
  userLogin: userLoginReducer,
});

const cartItemsLocalStorage = localStorage.getItem("cartItems");
const CheckCartItemsLS = cartItemsLocalStorage
  ? JSON.parse(cartItemsLocalStorage)
  : [];

const userInfoLocalStorage = localStorage.getItem("userInfo");
const CheckUserInfoLS = userInfoLocalStorage
  ? JSON.parse(userInfoLocalStorage)
  : null;

const initialState = {
  cart: { cartItems: CheckCartItemsLS },
  userLogin: { userInfo: CheckUserInfoLS },
};

const middlewares = [thunk];

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middlewares))
);

export default store;
