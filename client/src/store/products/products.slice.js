import { createSlice } from "@reduxjs/toolkit";
import {
  createProductReview,
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
  reviews: {
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
    resetReviewsState: (state) => {
      state.reviews = initialState.reviews;
    },
    resetUpdateProductsState: (state) => {
      state.update = initialState.update;
    },
    resetDeleteState: (state) => {
      state.delete = initialState.delete;
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
        state.product.error = action.payload;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.product.loading = false;
        state.product.success = true;
        state.product.data = action.payload;
      })

      // --> GET PRODUCTS <--
      .addCase(fetchProducts.pending, (state) => {
        state.products.loading = true;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.success = true;
        state.products.data = {
          products: action.payload.products,
          page: action.payload.page,
          pages: action.payload.pages,
        };
      })

      // --> GET TOP RATED PRODUCTS <--
      .addCase(fetchTopRatedProducts.pending, (state) => {
        state.topRated.loading = true;
      })
      .addCase(fetchTopRatedProducts.rejected, (state, action) => {
        state.topRated.loading = false;
        state.topRated.error = action.payload;
      })
      .addCase(fetchTopRatedProducts.fulfilled, (state, action) => {
        state.topRated.loading = false;
        state.topRated.success = true;
        state.topRated.data = action.payload;
      })

      // --> CREATE PRODUCT REVIEW <--
      .addCase(createProductReview.pending, (state) => {
        state.reviews.loading = true;
      })
      .addCase(createProductReview.rejected, (state, action) => {
        state.reviews.loading = false;
        state.reviews.error = action.payload;
      })
      .addCase(createProductReview.fulfilled, (state) => {
        state.reviews.loading = false;
        state.reviews.success = true;
      })

      // --> UPDATE PRODUCT <--
      .addCase(updateProduct.pending, (state) => {
        state.update.loading = true;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.update.loading = false;
        state.update.error = action.payload;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.update.loading = false;
        state.update.success = true;
        state.product.data = action.payload;
      })

      // --> DELETE PRODUCT <--
      .addCase(deleteProduct.pending, (state) => {
        state.delete.loading = true;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.delete.loading = false;
        state.delete.error = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state) => {
        state.delete.loading = false;
        state.delete.success = true;
      });
  },
});

export const {
  resetDeleteState,
  resetProductState,
  resetProductsState,
  resetReviewsState,
  resetTopRatedState,
  resetUpdateProductsState,
} = productSlice.actions;
export default productSlice.reducer;
