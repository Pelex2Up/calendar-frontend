import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import "moment/dist/locale/ru.js";
import moment from "moment";
import { AnimatePresence } from "motion/react";
import { persistStore } from "redux-persist";
import { store } from "./store/redux/store.ts";
import { PersistGate } from "redux-persist/integration/react";
import { Provider } from "react-redux";

moment().locale("ru").format("dddd, MMMM DD YYYY, h:mm");
const persistor = persistStore(store);

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider store={store}>
      {/* <StrictMode> */}
      <PersistGate loading={<p>Loading...</p>} persistor={persistor}>
        <AnimatePresence>
          <App />
        </AnimatePresence>
      </PersistGate>
      {/* </StrictMode> */}
    </Provider>
  </BrowserRouter>
);
