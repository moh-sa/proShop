import { api } from "./base";

export function createProductAPI(data, token) {
  return api.post(`/products/admin`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getProductsAPI({ keyword = "", pageNumber = "" }) {
  return api.get(`/products?keyword=${keyword}&pageNumber=${pageNumber}`);
}

export function getProductByIdAPI(productId) {
  return api.get(`/products/admin/${productId}`);
}

export function deleteProductAPI(productId, token) {
  return api.delete(`/products/admin/${productId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function addProductAPI(product, token) {
  return api.post(`/products`, product, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateProductAPI({ productId, data, token }) {
  return api.patch(`/products/admin/${productId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getTopRatedProductsAPI() {
  return api.get(`/products/top-rated`);
}
