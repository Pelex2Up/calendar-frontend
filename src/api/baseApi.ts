import { RootState } from "../store/redux/store";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).user.authState.access;
    if (token && token !== "") {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});
