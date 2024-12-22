import { api } from "./base";

export function createOrderAPI(order, token) {
  return api.post(`/orders`, order, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getOrderDetailsAPI(orderId, token) {
  return api.get(`/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function payOrderAPI(orderId, paymentResult, token) {
  return api.put(`/orders/${orderId}/pay`, paymentResult, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userInfo.token}`,
    },
  });
}

export function deliverOrderAPI(orderId, token) {
  return api.put(
    `/orders/${orderId}/deliver`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function listMyOrdersAPI(token) {
  return api.get(`/orders/myorders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function listOrdersAPI(token) {
  return api.get(`/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
