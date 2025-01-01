import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  deleteUserAPI,
  getUserDetailsAPI,
  listUsersAPI,
  updateUserAPI,
  updateUserProfileAPI,
} from "../../services/api";
import { setUserState } from "../auth/auth.slice";

// TODO: check if "user" and "token" are not undefined
export const deleteUser = createAsyncThunk(
  "users/delete",
  async ({ userId }, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      await deleteUserAPI(userId, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const fetchUserDetails = createAsyncThunk(
  "users/details",
  async ({ userId }, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();

      const { data } = await getUserDetailsAPI(userId, token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const fetchUsers = createAsyncThunk(
  "users/list",
  async (_, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      const { data } = await listUsersAPI(token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/update",
  async (user, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      const { data } = await updateUserAPI(user, token);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  "users/updateProfile",
  async (user, thunkAPI) => {
    try {
      const {
        auth: {
          user: { token },
        },
      } = thunkAPI.getState();
      const { data } = await updateUserProfileAPI(user, token);
      thunkAPI.dispatch(setUserState(data));
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
