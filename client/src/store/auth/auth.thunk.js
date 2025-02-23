import { createAsyncThunk } from "@reduxjs/toolkit";
import { signinAPI, signupAPI } from "../../services/api";

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const { data } = await signinAPI(email, password);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, thunkAPI) => {
    try {
      const { data } = await signupAPI(name, email, password);
      localStorage.setItem("auth", JSON.stringify(data));
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
