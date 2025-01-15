import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrderAPI,
  deliverOrderAPI,
  getOrderDetailsAPI,
  listMyOrdersAPI,
  listOrdersAPI,
  payOrderAPI,
} from "../../services/api";

// TODO: check if "user" and "token" are not undefined
export const fetchOrderDetails = createAsyncThunk(
  "orders/details",
  async ({ orderId }, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      const { data } = await getOrderDetailsAPI(orderId, token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const fetchAdminOrders = createAsyncThunk(
  "orders/adminList",
  async (_, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      const { data } = await listOrdersAPI(token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const fetchUserOrders = createAsyncThunk(
  "orders/userList",
  async (_, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();

      const { data } = await listMyOrdersAPI(token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const payOrder = createAsyncThunk(
  "orders/pay",
  async ({ orderId }, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();

      const { data } = await payOrderAPI(orderId, token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const createOrder = createAsyncThunk(
  "orders/create",
  async (order, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      const { data } = await createOrderAPI(order, token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const deliverOrder = createAsyncThunk(
  "orders/deliver",
  async ({ orderId }, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      const { data } = await deliverOrderAPI(orderId, token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
