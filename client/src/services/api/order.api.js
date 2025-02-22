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

export function payOrderAPI(orderId, token) {
  return api.patch(
    `/orders/admin/${orderId}/payment`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function deliverOrderAPI(orderId, token) {
  return api.patch(
    `/orders/admin/${orderId}/delivery`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function getOrdersByUserIdAPI(userId, token) {
  return api.get(`/orders/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function listOrdersAPI(token) {
  return api.get(`/orders/admin`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
