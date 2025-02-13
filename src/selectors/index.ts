import { RootState } from "../store/redux/store";

export const selectUser = (state: RootState) => state.user;
export const authSelector = (state: RootState) => state.user.auth;
