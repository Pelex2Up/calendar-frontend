import { FC } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip } from "react-tooltip";

export const MainLayout: FC = () => {
  return (
    <>
      <Outlet />
      <Toaster position="bottom-right" reverseOrder={false} />
      <Tooltip
        id="my-tooltip"
        style={{ zIndex: "99999" }}
      />
    </>
  );
};
