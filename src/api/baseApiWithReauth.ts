import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { authState, logoutState } from "../store/redux/user/slice";
import { refreshApi } from "./userService";
import { RootState } from "store/redux/store";
import { Mutex } from "async-mutex";
import { baseQuery } from "./baseApi";

const mutex = new Mutex();

const requestQueue: (string | FetchArgs)[] = [];

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 403) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshResult = await api
          .dispatch(
            refreshApi.endpoints.refreshToken.initiate({
              refresh: (api.getState() as RootState).user.authState.refresh,
              userId: (api.getState() as RootState).user.userId,
            })
          )
          .unwrap();
        if (refreshResult.access && refreshResult.refresh) {
          api.dispatch(authState(refreshResult));
          // Добавлено для проверки бесшовности обновления токена!!!! (возможно не будет работать -_-)
          for (const request of requestQueue) {
            result = await baseQuery(request, api, extraOptions);
          }
          requestQueue.length = 0; // чистка очереди
        } else {
          api.dispatch(logoutState());
        }
      } catch {
        api.dispatch(logoutState());
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      requestQueue.push(args); // добавление запросов в очередь
      result = await baseQuery(args, api, extraOptions);
    }
  }
  return result;
};
