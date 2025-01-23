import { api } from "./base";

export function createProductAPI(data, token) {
  return api.post(`/products`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getProductsAPI({ keyword = "", pageNumber = "" }) {
  return api.get(`/products?keyword=${keyword}&pageNumber=${pageNumber}`);
}

export function getProductByIdAPI(productId) {
  return api.get(`/products/${productId}`);
}

export function deleteProductAPI(productId, token) {
  return api.delete(`/products/${productId}`, {
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

export function updateProductAPI(product, token) {
  return api.put(`/products/${product._id}`, product, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function addProductReviewAPI(productId, review, token) {
  return api.post(`/products/${productId}/reviews`, review, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getTopRatedProductsAPI() {
  return api.get(`/products/top-rated`);
}

export function uploadImageAPI(formData) {
  return api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
