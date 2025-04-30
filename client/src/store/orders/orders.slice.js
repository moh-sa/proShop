import { createSlice } from "@reduxjs/toolkit";
import {
  createOrder,
  deliverOrder,
  fetchAdminOrders,
  fetchOrderDetails,
  fetchUserOrders,
  payOrder,
} from "./orders.thunk";

const initialState = {
  order: {
    data: undefined,
    loading: false,
    success: false,
    error: undefined,
  },
  orders: {
    data: [],
    loading: false,
    success: false,
    error: undefined,
  },
  create: {
    data: undefined,
    loading: false,
    success: false,
    error: undefined,
  },
  pay: {
    loading: false,
    success: false,
    error: undefined,
  },
  deliver: {
    loading: false,
    success: false,
    error: undefined,
  },
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.order = initialState.order;
    },
    resetOrdersState: (state) => {
      state.orders = initialState.orders;
    },
    resetCreateOrderState: (state) => {
      state.create = initialState.create;
    },
    resetPayState: (state) => {
      state.pay = initialState.pay;
    },
    resetDeliverState: (state) => {
      state.deliver = initialState.deliver;
    },
  },
  extraReducers: (builder) => {
    // --> GET ORDER <--
    builder
      .addCase(fetchOrderDetails.pending, (state) => {
        state.order.loading = true;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.order.loading = false;
        state.order.error = action.payload.errors;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.order.loading = false;
        state.order.success = true;
        state.order.data = action.payload.data;
      })

      // --> GET (ADMIN) ORDERS <--
      .addCase(fetchAdminOrders.pending, (state) => {
        state.orders.loading = true;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload.errors;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.orders.loading = false;
        state.orders.success = true;
        state.orders.data = action.payload.data;
      })

      // --> GET (USER) ORDERS <--
      .addCase(fetchUserOrders.pending, (state) => {
        state.orders.loading = true;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload.errors;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.orders.loading = false;
        state.orders.success = true;
        state.orders.data = action.payload.data;
      })

      // --> CREATE ORDER <--
      .addCase(createOrder.pending, (state) => {
        state.create.loading = true;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.create.loading = false;
        state.create.error = action.payload.errors;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.create.loading = false;
        state.create.success = true;
        state.create.data = action.payload.data;
      })

      // --> PAY ORDER <--
      .addCase(payOrder.pending, (state) => {
        state.pay.loading = true;
      })
      .addCase(payOrder.rejected, (state, action) => {
        state.pay.loading = false;
        state.pay.error = action.payload.errors;
      })
      .addCase(payOrder.fulfilled, (state) => {
        state.pay.loading = false;
        state.pay.success = true;
      })

      // --> DELIVER ORDER <--
      .addCase(deliverOrder.pending, (state) => {
        state.deliver.loading = true;
      })
      .addCase(deliverOrder.rejected, (state, action) => {
        state.deliver.loading = false;
        state.deliver.error = action.payload.errors;
      })
      .addCase(deliverOrder.fulfilled, (state) => {
        state.deliver.loading = false;
        state.deliver.success = true;
      });
  },
});

export const {
  resetOrderState,
  resetOrdersState,
  resetCreateOrderState,
  resetPayState,
  resetDeliverState,
} = ordersSlice.actions;
export default ordersSlice.reducer;
