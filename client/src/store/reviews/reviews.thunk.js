import { createAsyncThunk } from "@reduxjs/toolkit";
import { createReviewAPI, getReviewsByProductIdAPI } from "../../services/api";

export const createReviewThunk = createAsyncThunk(
  "reviews/create",
  async (data, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();

      const res = await createReviewAPI({ data, token });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const getReviewsByProductIdThunk = createAsyncThunk(
  "reviews/reviews-by-product-id",
  async ({ productId }, thunkAPI) => {
    try {
      const { data } = await getReviewsByProductIdAPI({ productId });
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
