import { IListTask } from "../../../api/apiTypes";
import { FC, FormEvent, useEffect, useState } from "react";
import "./componentsCalendar.css";
import { Modal } from "../../../components/Modal";
import { DayPicker } from "react-day-picker";
import { ru } from "date-fns/locale";
import {
  useDeleteTaskMutation,
  usePublishTaskMutation,
} from "../../../api/calendarServices";
import { useAppSelector } from "../../../store/hooks";
import { selectUser } from "../../../selectors";
import toast from "react-hot-toast";
import moment from "moment";
import { TimeInput } from "../../../components/common/TimeInput";
import { ISelectedCreate } from "./modalCreateTask";

interface IDetailsTaskModal {
  isOpen: boolean;
  onClose: () => void;
  task: IListTask;
  machines: any[];
  materials: any[];
  formats: { Item1: number; Item2: { Key: string; Value: number }[] }[];
  density: { Item1: number; Item2: number[] }[];
}

export const ModalTaskDetails: FC<IDetailsTaskModal> = ({
  isOpen,
  onClose,
  task,
  machines,
  materials,
  formats,
  density,
}) => {
  const [deleteTask] = useDeleteTaskMutation();
  const [publishTask] = usePublishTaskMutation();
  const { userId } = useAppSelector(selectUser);
  const [taskName, setTaskName] = useState<string>("");
  const [autoTime, setAutoTime] = useState<boolean>(true);
  const [lock, setLock] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [comment, setComment] = useState<string>(task.optionalComment);
  const [autoTaskTime, setAutoTaskTime] = useState<boolean>(true);
  const [taskTime, setTaskTime] = useState<string>("00:00");
  const [createTime, setCreateTime] = useState<string>("00:00");
  const [densityArray, setDensityArray] = useState<number[]>();
  const [formatArray, setFormatArray] =
    useState<{ Key: string; Value: number }[]>();
  const [selectedState, setSelectedState] = useState<ISelectedCreate>({
    machine: task.machineId,
    material: materials[0].Value,
    density: densityArray ? densityArray[0] : undefined,
    format: formatArray ? formatArray[0].Value : undefined,
  });

  const updateField = (field: keyof ISelectedCreate, value: number) => {
    setSelectedState((prevState) => ({
      ...prevState,
      [field]: value, // Изменяем только указанное поле
    }));
  };

  useEffect(() => {
    if (selectedState.material && density) {
      const updatedArray = density.find(
        (item) => item.Item1 === selectedState.material
      );

      if (updatedArray && updatedArray.Item2.length > 0) {
        setDensityArray(updatedArray.Item2);
        updateField("density", updatedArray.Item2[0]);
      }
    }

    if (selectedState.material && formats) {
      const updatedArray = formats.find(
        (item) => item.Item1 === selectedState.material
      );

      if (updatedArray && updatedArray.Item2.length > 0) {
        setFormatArray(updatedArray.Item2);
        updateField("format", updatedArray.Item2[0].Value);
      }
    }
  }, [density, formats, selectedState.material]);

  useEffect(() => {
    if (taskName !== task.name) {
      setTaskTime(
        `${String(task.hours).padStart(2, "0")}:${String(task.minutes).padStart(
          2,
          "0"
        )}`
      );
      setTaskName(task.name);
      setLock(task.isLocked);
      setComment(task.optionalComment);
    }
  }, [task]);

  useEffect(() => {
    if (createTime !== "00:00" && selectedDate) {
      setLock(true);
    }
  }, [selectedDate, createTime]);

  const submitFormData = (event: FormEvent) => {
    event.preventDefault();
    const submitedData = {
      name: taskName,
      hours: Number(taskTime.split(":")[0]),
      minutes: Number(taskTime.split(":")[1]),
      machineId: selectedState.machine,
      optionalComment: comment,
      automaticPublishing: autoTime,
      lockTask: lock,
      optionalUnixTimestampToPublish: selectedDate
        ? moment(selectedDate.toISOString()).valueOf() / 1000
        : "",
      optionalAutomaticTimeSelection: autoTaskTime,
      optionalHourToPublish: Number(createTime.split(":")[0]),
      optionalMinutesToPublish: Number(createTime.split(":")[1]),
    };
    if (submitedData && userId) {
      publishTask({
        userId: userId,
        taskId: task.id,
        newTaskFromPost: submitedData,
      })
        .unwrap()
        .then((data) => {
          toast.success(data.optionalAlertMessage);
          onClose();
        })
        .catch((err) => toast.error(err.data.optionalAlertMessage));
    }
  };

  const handleDelete = () => {
    deleteTask({ userId: Number(userId), taskId: task.id })
      .unwrap()
      .then((data) => {
        toast.success(data.optionalAlertMessage);
        onClose();
      })
      .catch((err) => toast.error(err.data.optionalAlertMessage));
  };

  const closeModal = async () => {
    setSelectedState({
      machine: task.machineId,
      material: materials[0].Value,
      density: densityArray ? densityArray[0] : undefined,
      format: formatArray ? formatArray[0].Value : undefined,
    });
    setCreateTime("00:00");
    setTaskTime(
      `${String(task.hours).padStart(2, "0")}:${String(task.minutes).padStart(
        2,
        "0"
      )}`
    );
    setComment(task.optionalComment);
    setLock(false);
    setTaskName(task.name);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal}>
      <form className="wrapper" onSubmit={submitFormData}>
        <h2>Редактирование задачи</h2>
        <label htmlFor="title">Название задачи:</label>
        <input
          style={{ marginTop: "-0.5rem" }}
          value={taskName}
          required
          onChange={(event) => setTaskName(event.target.value)}
        />
        <div className="wrapper-selector" style={{ height: "min-content" }}>
          <label htmlFor="description">Описание задачи:</label>
          <p style={{ fontSize: 14 }}>{task.description}</p>
        </div>

        <div className="wrapper-time">
          <label htmlFor="hours">Время на выполнение*:</label>
          <TimeInput name="time" setTime={setTaskTime} time={taskTime} />
        </div>
        <div className="wrapper-selector">
          <label htmlFor="machine">Машина:</label>
          <select
            id="machine"
            required
            value={selectedState.machine}
            onChange={(e) => updateField("machine", Number(e.target.value))}
          >
            {machines.map((machine) => (
              <option value={machine.Value} key={machine.Value}>
                {machine.Key}
              </option>
            ))}
          </select>
        </div>
        <div className="wrapper-comment">
          <label htmlFor="comment">Комментарий печатнику:</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>
        <div className="wrapper-picker">
          <label htmlFor="date&time">Автоматический выбор даты и времени</label>
          <input
            type="checkbox"
            checked={autoTime}
            onChange={() => setAutoTime(!autoTime)}
            id="date&time"
          />
        </div>
        {/* <p className="notify">Актуально только при постановке в график</p> */}
        <div className="wrapper-picker" style={{ marginBottom: "1rem" }}>
          <label htmlFor="lock">Залочить при постановке в график</label>
          <input
            type="checkbox"
            checked={lock}
            onChange={() => setLock(!lock)}
            id="lock"
          />
        </div>
        {/* <p className="notify">Актуально только при постановке в график</p> */}
        {!autoTime && (
          <div style={{ marginBottom: "0.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>Выберите дату:</h3>
            <DayPicker
              mode="single" // Режим выбора одной даты
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ru}
              captionLayout="dropdown-months"
            />
            <p style={{ fontWeight: "bold" }}>
              Выбранная дата:{" "}
              {selectedDate
                ? moment(selectedDate.toISOString()).format("LL")
                : ""}
            </p>
            <h4 style={{ textAlign: "center", marginBottom: 0 }}>
              Время в графике:
            </h4>
            <div
              className="wrapper-picker"
              style={{
                margin: "0 auto",
                padding: "0.5rem 0",
                width: "fit-content",
                gap: "10px",
              }}
            >
              <label htmlFor="auto">Автоматически</label>
              <input
                type="checkbox"
                checked={autoTaskTime}
                onChange={() => setAutoTaskTime(!autoTaskTime)}
                id="auto"
              />
            </div>
            {!autoTaskTime && (
              <div
                className="wrapper-time"
                style={{ margin: "0 auto", width: "fit-content" }}
              >
                <label htmlFor="hours-time">
                  На какое время ставим задачу?
                </label>
                <TimeInput
                  name="createTime"
                  time={createTime}
                  setTime={setCreateTime}
                />
              </div>
            )}
          </div>
        )}
        <div className="buttons">
          {autoTime && (
            <button
              type="button"
              className="buttons-delete"
              onClick={handleDelete}
            >
              Удалить
            </button>
          )}
          <button
            type="submit"
            style={!autoTime ? { margin: "0 auto" } : {}}
            className="buttons-addCalendar"
          >
            Поставить в график
          </button>
        </div>
      </form>
    </Modal>
  );
};
