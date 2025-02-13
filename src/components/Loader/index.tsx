import { FC } from "react";
import "./styleLoader.css";
import { MutatingDots } from "react-loader-spinner";

export const Loader: FC = () => {
  return (
    <div className="loaderWrapper">
      <MutatingDots
        visible={true}
        height="100"
        width="100"
        color="#be6464"
        secondaryColor="#be6464"
        radius="12.5"
        ariaLabel="mutating-dots-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
      <h3>Загрузка...</h3>
    </div>
  );
};
