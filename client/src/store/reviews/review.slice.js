import { createSlice } from "@reduxjs/toolkit";
import { createReviewThunk, getReviewsByProductIdThunk } from "./reviews.thunk";

const initialState = {
  create: {
    data: undefined,
    loading: false,
    success: false,
    error: undefined,
  },
  reviews: {
    data: [],
    loading: false,
    success: false,
    error: undefined,
  },
};

const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    resetCreateReviewState: (state) => {
      state.create = initialState.create;
    },
  },
  extraReducers: (builder) => {
    builder
      // --> CREATE PRODUCT <--
      .addCase(createReviewThunk.pending, (state) => {
        state.create = {
          ...initialState.create,
          loading: true,
        };
      })
      .addCase(createReviewThunk.rejected, (state, action) => {
        state.create.loading = false;
        state.create.error = action.payload;
      })
      .addCase(createReviewThunk.fulfilled, (state, action) => {
        state.create.loading = false;
        state.create.success = true;

        state.reviews.data.push(action.payload);
      })

      // --> GET REVIEWS BY PRODUCT ID <--
      .addCase(getReviewsByProductIdThunk.pending, (state) => {
        state.reviews = {
          ...initialState.reviews,
          loading: true,
        };
      })
      .addCase(getReviewsByProductIdThunk.rejected, (state, action) => {
        state.reviews.loading = false;
        state.reviews.error = action.payload;
      })
      .addCase(getReviewsByProductIdThunk.fulfilled, (state, action) => {
        state.reviews.loading = false;
        state.reviews.success = true;
        state.reviews.data = action.payload;
      });
  },
});

export const { resetCreateReviewState } = reviewsSlice.actions;
export default reviewsSlice.reducer;
