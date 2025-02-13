import {
  combineReducers,
  configureStore,
  PreloadedState,
} from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import * as services from "../../api/index";
import * as slices from "./index";

export const rootReducer = combineReducers({
  [services.userAccessService.reducerPath]: services.userAccessService.reducer,
  [services.calendarService.reducerPath]: services.calendarService.reducer,
  [services.refreshApi.reducerPath]: services.refreshApi.reducer,
  user: slices.authReduce,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "orgId"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const setupStore = (preloadedState?: PreloadedState<RootState>) => {
  return configureStore({
    reducer: persistedReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }).concat(
        services.userAccessService.middleware,
        services.calendarService.middleware,
        services.refreshApi.middleware
      ),
  });
};

export const store = setupStore();
export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
