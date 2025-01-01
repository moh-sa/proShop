import { createSlice } from "@reduxjs/toolkit";
import { login, register } from "./auth.thunk";

const emptyInitialState = {
  loading: false,
  success: false,
  error: undefined,
  user: undefined,
};

const initialState = localStorage.getItem("auth")
  ? {
      ...emptyInitialState,
      user: JSON.parse(localStorage.getItem("auth")),
    }
  : emptyInitialState;

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authLogout: (state) => {
      state = emptyInitialState;
      localStorage.removeItem("auth");
    },
    setUserState: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // --> LOGIN <--
    builder.addCase(login.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.success = true;
      state.user = action.payload;
      localStorage.setItem("auth", JSON.stringify(action.payload));
    });

    // --> REGISTER <--
    builder.addCase(register.pending, (state) => (state = initialState));
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false;
      state.success = true;
      state.user = action.payload;
      localStorage.setItem("auth", JSON.stringify(action.payload));
    });
  },
});

export const { authLogout, setUserState } = AuthSlice.actions;
export default AuthSlice.reducer;
