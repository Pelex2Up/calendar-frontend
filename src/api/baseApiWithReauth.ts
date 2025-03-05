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

const requestQueue: {
  args: string | FetchArgs;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}[] = [];

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

          // Обработка всех запросов в ожидании
          for (const request of requestQueue) {
            try {
              const response = await baseQuery(request.args, api, extraOptions);
              request.resolve(response);
            } catch (error) {
              request.reject(error);
            }
          }
          requestQueue.length = 0; // Очистка очереди
        } else {
          api.dispatch(logoutState());
        }
      } catch (error) {
        // Ошибка получения нового токена — уведомляем остальные запросы
        for (const request of requestQueue) {
          request.reject(error);
        }
        requestQueue.length = 0; // Очистка очереди
        api.dispatch(logoutState());
      } finally {
        release();
      }
    } else {
      const promise = new Promise((resolve, reject) => {
        requestQueue.push({ args, resolve, reject });
      });
      await promise; // Ждем, пока не будет выполнено обновление токена и вызов resolve/reject
      result = await baseQuery(args, api, extraOptions); // Теперь окончательно выполняем запрос
    }
  }

  return result;
};
