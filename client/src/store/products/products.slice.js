import { createSlice } from "@reduxjs/toolkit";
import {
  createProduct,
  deleteProduct,
  fetchProductDetails,
  fetchProducts,
  fetchTopRatedProducts,
  updateProduct,
} from "./products.thunk";

const initialState = {
  product: {
    data: undefined,
    loading: false,
    success: false,
    error: undefined,
  },
  products: {
    data: undefined,
    loading: false,
    success: false,
    error: undefined,
  },
  topRated: {
    data: undefined,
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
  update: {
    loading: false,
    success: false,
    error: undefined,
  },
  delete: {
    loading: false,
    success: false,
    error: undefined,
  },
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    resetProductState: (state) => {
      state.product = initialState.product;
    },
    resetProductsState: (state) => {
      state.products = initialState.products;
    },
    resetTopRatedState: (state) => {
      state.topRated = initialState.topRated;
    },
    resetUpdateProductsState: (state) => {
      state.update = initialState.update;
    },
    resetDeleteProductState: (state) => {
      state.delete = initialState.delete;
    },
    resetCreateProductState: (state) => {
      state.create = initialState.create;
    },
  },
  extraReducers: (builder) => {
    builder
      // --> GET PRODUCT <--
      .addCase(fetchProductDetails.pending, (state) => {
        state.product.loading = true;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.product.loading = false;
        state.product.error = action.payload.errors;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.product.loading = false;
        state.product.success = true;
        state.product.data = action.payload.data;
      })

      // --> GET PRODUCTS <--
      .addCase(fetchProducts.pending, (state) => {
        state.products.loading = true;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload.errors;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.success = true;
        state.products.data = {
          products: action.payload.data,
          page: action.payload.meta.currentPage,
          pages: action.payload.meta.numberOfPages,
        };
      })

      // --> GET TOP RATED PRODUCTS <--
      .addCase(fetchTopRatedProducts.pending, (state) => {
        state.topRated.loading = true;
      })
      .addCase(fetchTopRatedProducts.rejected, (state, action) => {
        state.topRated.loading = false;
        state.topRated.error = action.payload.errors;
      })
      .addCase(fetchTopRatedProducts.fulfilled, (state, action) => {
        state.topRated.loading = false;
        state.topRated.success = true;
        state.topRated.data = action.payload.data;
      })

      // --> CREATE PRODUCT <--
      .addCase(createProduct.pending, (state) => {
        state.create.loading = true;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.create.loading = false;
        state.create.error = action.payload.errors;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.create.loading = false;
        state.create.success = true;
      })

      // --> UPDATE PRODUCT <--
      .addCase(updateProduct.pending, (state) => {
        state.update.loading = true;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.update.loading = false;
        state.update.error = action.payload.errors;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.update.loading = false;
        state.update.success = true;
        state.product.data = action.payload.data;
      })

      // --> DELETE PRODUCT <--
      .addCase(deleteProduct.pending, (state) => {
        state.delete.loading = true;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.delete.loading = false;
        state.delete.error = action.payload.errors;
      })
      .addCase(deleteProduct.fulfilled, (state) => {
        state.delete.loading = false;
        state.delete.success = true;
      });
  },
});

export const {
  resetDeleteProductState,
  resetProductState,
  resetProductsState,
  resetTopRatedState,
  resetUpdateProductsState,
  resetCreateProductState,
} = productSlice.actions;
export default productSlice.reducer;
