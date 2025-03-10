import "./App.module.scss";
import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { MainLayout } from "./components/MainLayout";
import { PathE } from "./enum/PathE";
import { FC } from "react";
import { CalendarPage } from "./pages/CalendarPage";
import { NotFound404 } from "./pages/404Page";
import { useAppSelector } from "./store/hooks";
import { selectUser } from "./selectors";

export const App: FC = () => {
  const { auth: isAuth } = useAppSelector(selectUser);

  return (
    <div>
      <Routes>
        <Route path={PathE.Initial} element={<MainLayout />}>
          {isAuth ? (
            <Route index element={<CalendarPage />} />
          ) : (
            <Route index element={<LoginPage />} />
          )}
        </Route>
        <Route path={"*"} element={<NotFound404 />} />
      </Routes>
    </div>
  );
};
