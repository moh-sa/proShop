import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  createProductAPI,
  deleteProductAPI,
  getProductByIdAPI,
  getProductsAPI,
  getTopRatedProductsAPI,
  updateProductAPI,
} from "../../services/api";

// TODO: check if "user" and "token" are not undefined
export const fetchProductDetails = createAsyncThunk(
  "products/details",
  async ({ productId }, thunkAPI) => {
    try {
      const { data } = await getProductByIdAPI(productId);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const fetchProducts = createAsyncThunk(
  "products/list",
  async ({ keyword = "", pageNumber = "" }, thunkAPI) => {
    try {
      const { data } = await getProductsAPI({ keyword, pageNumber });
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const fetchTopRatedProducts = createAsyncThunk(
  "products/top-rated",
  async (_, thunkAPI) => {
    try {
      const { data } = await getTopRatedProductsAPI();
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async ({ productId, data }, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      const response = await updateProductAPI({
        productId,
        data,
        token,
      });

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async ({ productId }, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      await deleteProductAPI(productId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const createProduct = createAsyncThunk(
  "products/create",
  async ({ data }, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();

      await createProductAPI(data, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
