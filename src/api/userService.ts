import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/dist/query/react";

import { baseQuery } from "./baseApi";
import { ILoginResponse } from "./apiTypes";
import { RootState } from "store/redux/store";

export const userAccessService = createApi({
  reducerPath: "userAccessService",
  baseQuery: baseQuery,
  endpoints: (build) => ({
    loginUser: build.mutation<
      ILoginResponse,
      { login: string; password: string }
    >({
      query: (body) => ({
        url: `/AuthorizeUser/`,
        method: "POST",
        body: body,
      }),
    }),
    logoutUser: build.mutation<any, { data: any; schoolName: string }>({
      query: ({ data, schoolName }) => ({
        url: `/${schoolName}/access-distribution/`,
        method: "DELETE",
        body: data,
        responseHandler: (response) => response.text(),
      }),
    }),
  }),
});

export const refreshApi = createApi({
  reducerPath: "refreshApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      const { refresh: refreshToken } = (getState() as RootState).user
        .authState;
      if (refreshToken) {
        headers.set("Authorization", `Bearer ${refreshToken}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    refreshToken: builder.mutation<
      { access: string; refresh: string },
      { refresh: string; userId: number }
    >({
      query: (data) => ({
        url: "/UpdateUserAccessToken",
        method: "POST",
        body: { refreshToken: data.refresh, userId: data.userId },
      }),
    }),
  }),
});

export const { useLoginUserMutation, useLogoutUserMutation } =
  userAccessService;
