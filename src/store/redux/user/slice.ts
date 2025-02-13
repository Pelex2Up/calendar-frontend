import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserT } from "../../../types/common";

const initialState: UserT = {
  authState: {
    access: "",
    refresh: "",
  },
  auth: false,
  role: 0,
  userId: 0,
  orgId: 0,
};

export const sliceUser = createSlice({
  name: "user",
  initialState,
  reducers: {
    authUserState: (state, action) => {
      state = action.payload;
    },
    authState: (state, action) => {
      state.authState = action.payload;
    },
    auth: (state, action: PayloadAction<boolean>) => {
      state.auth = action.payload;
    },
    role: (state, action: PayloadAction<number>) => {
      state.role = action.payload;
    },
    orgId: (state, action: PayloadAction<number>) => {
      state.orgId = action.payload;
    },
    id: (state, action: PayloadAction<number>) => {
      state.userId = action.payload;
    },
    logoutState: () => {
      return initialState;
    },
  },
});

export const { auth, role, id, orgId, logoutState, authState, authUserState } =
  sliceUser.actions;
export const authReduce = sliceUser.reducer;
