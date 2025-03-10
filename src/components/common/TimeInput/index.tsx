import { FC, KeyboardEvent } from "react";
import styles from "./timeInput.module.scss";

type TimeInputT = {
  name: string;
  time: string;
  setTime: (arg: string) => void;
};

export const TimeInput: FC<TimeInputT> = ({ name, time, setTime }) => {
  const updateTime = (val: string, data: "hour" | "min") => {
    if (data === "hour") {
      setTime(val + ":" + time.split(":")[1]);
    } else if (data === "min") {
      if (Number(val) < 60 && Number(val) >= 0) {
        setTime(time.split(":")[0] + ":" + val);
      }
    }
  };

  // const onKeyDownHour = (event: KeyboardEvent<HTMLInputElement>) => {
  //   if (time.split(":")[0].length >= 3 && /\d/.test(event.key)) {
  //     event.preventDefault();
  //   }
  // };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (
      !/\d/.test(event.key) &&
      event.key !== "Delete" &&
      event.key !== "Backspace" &&
      event.key !== "Tab"
    ) {
      event.preventDefault();
    }
  };

  return (
    <div className={styles.timeInput} id={name}>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        id="hours"
        placeholder="ЧЧ"
        maxLength={2}
        min={"00"}
        max={"99"}
        required
        onKeyDown={onKeyDown}
        value={time.split(":")[0]}
        onChange={(e) => updateTime(e.target.value, "hour")}
      />
      <span>:</span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        id="minutes"
        maxLength={2}
        placeholder="ММ"
        min={"00"}
        max={"59"}
        onKeyDown={onKeyDown}
        required
        value={time.split(":")[1]}
        onChange={(e) => updateTime(e.target.value, "min")}
      />
      <svg
        width={15}
        height={15}
        focusable="false"
        aria-hidden="true"
        viewBox="0 0 24 24"
        data-testid="AccessTimeIcon"
      >
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8"></path>
        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path>
      </svg>
    </div>
  );
};
