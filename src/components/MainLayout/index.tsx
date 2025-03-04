import { FC } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "react-tooltip/dist/react-tooltip.css";
import { Tooltip } from "react-tooltip";

export const MainLayout: FC = () => {
  return (
    <>
      <Outlet />
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{ duration: 8000 }}
        containerStyle={{
          // position: "relative",
          zIndex: "999999999",
        }}
      />
      <Tooltip id="my-tooltip" style={{ zIndex: "9999" }} />
    </>
  );
};
