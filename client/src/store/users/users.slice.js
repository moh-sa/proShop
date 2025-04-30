import { createSlice } from "@reduxjs/toolkit";
import {
  deleteUser,
  fetchUserDetails,
  fetchUsers,
  updateUser,
  updateUserProfile,
} from "./users.thunk";

const initialState = {
  user: {
    data: undefined,
    loading: false,
    success: false,
    error: undefined,
  },
  users: {
    data: [],
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

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.user = initialState.user;
    },
    resetUsersState: (state) => {
      state.users = initialState.users;
    },
    resetUpdateUsersState: (state) => {
      state.update = initialState.update;
    },
    resetDeleteState: (state) => {
      state.delete = initialState.delete;
    },
  },
  extraReducers: (builder) => {
    // --> USER <--
    builder
      .addCase(fetchUserDetails.pending, (state) => {
        state.user.loading = true;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.user.loading = false;
        state.user.error = action.payload.errors;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.user.loading = false;
        state.user.success = true;
        state.user.data = action.payload.data;
      })

      // --> USERS <--
      .addCase(fetchUsers.pending, (state) => {
        state.users.loading = true;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload.errors;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.success = true;
        state.users.data = action.payload.data;
      })

      // --> UPDATE <--
      .addCase(updateUser.pending, (state) => {
        state.update.loading = true;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.update.loading = false;
        state.update.error = action.payload.errors;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.update.loading = false;
        state.update.success = true;
      })

      // --> UPDATE PROFILE <--
      .addCase(updateUserProfile.pending, (state) => {
        state.update.loading = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.update.loading = false;
        state.update.error = action.payload.errors;
      })
      .addCase(updateUserProfile.fulfilled, (state) => {
        state.update.loading = false;
        state.update.success = true;
      })

      // --> DELETE <--
      .addCase(deleteUser.pending, (state) => {
        state.delete.loading = true;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.delete.loading = false;
        state.delete.error = action.payload.errors;
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.delete.loading = false;
        state.delete.success = true;
      });
  },
});

export const {
  resetUserState,
  resetUsersState,
  resetUpdateUsersState,
  resetDeleteState,
} = usersSlice.actions;
export default usersSlice.reducer;
