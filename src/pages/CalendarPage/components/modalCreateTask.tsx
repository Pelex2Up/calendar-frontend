import { FC, FormEvent, FormEventHandler, useEffect, useState } from "react";
import { Modal } from "../../../components/Modal";
import "./componentsCalendar.css";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { ru } from "date-fns/locale";
import { useCreateNewTaskMutation } from "../../../api/calendarServices";
import { useAppSelector } from "../../../store/hooks";
import { selectUser } from "../../../selectors";
import toast from "react-hot-toast";
import { Loader } from "../../../components/Loader";
import moment from "moment";

interface ICreateTaskModal {
  isOpen: boolean;
  onClose: () => void;
  machines: any[];
  materials: any[];
  formats: { Item1: number; Item2: { Key: string; Value: number }[] }[];
  density: { Item1: number; Item2: number[] }[];
}

export interface ISelectedCreate {
  machine: number;
  material: number;
  format: number | undefined;
  density: number | undefined;
}

export const ModalCreateTask: FC<ICreateTaskModal> = ({
  isOpen,
  onClose,
  machines,
  materials,
  formats,
  density,
}) => {
  const { userId } = useAppSelector(selectUser);
  const [taskName, setTaskName] = useState<string>("");
  const [autoTime, setAutoTime] = useState<boolean>(true);
  const [lock, setLock] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [comment, setComment] = useState<string>("");
  const [autoTaskTime, setAutoTaskTime] = useState<boolean>(true);
  const [densityArray, setDensityArray] = useState<number[]>();
  const [formatArray, setFormatArray] =
    useState<{ Key: string; Value: number }[]>();
  const [selectedState, setSelectedState] = useState<ISelectedCreate>({
    machine: machines[0].Value,
    material: materials[0].Value,
    density: densityArray ? densityArray[0] : undefined,
    format: formatArray ? formatArray[0].Value : undefined,
  });
  const [publish, setPublish] = useState<boolean>(false);
  const [taskTime, setTaskTime] = useState<string>("00:00");
  const [createTime, setCreateTime] = useState<string>("00:00");
  const [createTask, { isLoading }] = useCreateNewTaskMutation();

  useEffect(() => {
    if (createTime !== "00:00" && selectedDate) {
      setLock(true);
    }
  }, [selectedDate, createTime]);

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

  const updateField = (field: keyof ISelectedCreate, value: number) => {
    setSelectedState((prevState) => ({
      ...prevState,
      [field]: value, // Изменяем только указанное поле
    }));
  };

  const submitFormData = (event: FormEvent) => {
    event.preventDefault();
    const submitedData = {
      name: taskName,
      hours: Number(taskTime.split(":")[0]),
      minutes: Number(taskTime.split(":")[1]),
      machineId: selectedState.machine,
      paperType: selectedState.material,
      density: selectedState.density,
      paperFormat: selectedState.format,
      optionalComment: comment,
      automaticPublishing: autoTime,
      lockTask: lock,
      optionalUnixTimestampToPublish: selectedDate
        ? moment(selectedDate.toISOString()).valueOf() / 1000
        : "",
      optionalAutomaticTimeSelection: autoTaskTime,
      optionalHourToPublish: autoTaskTime
        ? 0
        : Number(createTime.split(":")[0]),
      optionalMinutesToPublish: autoTaskTime
        ? 0
        : Number(createTime.split(":")[1]),
      publishImmidiately: publish,
    };
    if (submitedData && userId) {
      createTask({ userId: userId, newTaskFromPost: submitedData })
        .unwrap()
        .then((data) => {
          setTaskName("");
          setAutoTime(true);
          setLock(false);
          setSelectedDate(undefined);
          setPublish(false);
          setComment("");
          setCreateTime("00:00");
          setTaskTime("00:00");
          toast.success(data.optionalAlertMessage);
          onClose();
        })
        .catch((err) => toast.error(err.data.optionalAlertMessage));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {isLoading && <Loader />}
      <form className="wrapper" onSubmit={submitFormData}>
        <h2>Создание новой задачи</h2>
        <label htmlFor="title">Название задачи:</label>
        <input
          style={{ marginTop: "-0.5rem" }}
          value={taskName}
          required
          onChange={(event) => setTaskName(event.target.value)}
        />

        <div className="wrapper-time">
          <label htmlFor="hours">Время на выполнение:</label>
          <input
            id="hours"
            type="time"
            required
            min={"00:05"}
            style={{ width: "110px" }}
            value={taskTime}
            onChange={(event) => setTaskTime(event.target.value)}
            name="taskTime"
          />
        </div>
        <div className="wrapper-selector">
          <label htmlFor="machine">Машина:</label>
          <select
            id="machine"
            required
            defaultValue={"Выберите машину"}
            value={selectedState.machine}
            onChange={(event) =>
              updateField("machine", Number(event.target.value))
            }
          >
            {machines.map((machine, index) => (
              <option value={machine.Value} key={machine.Value}>
                {machine.Key}
              </option>
            ))}
          </select>
        </div>
        <div className="wrapper-selector">
          <label htmlFor="material">Материал:</label>
          <select
            id="material"
            required
            defaultValue={"Выберите материал"}
            value={selectedState.material}
            onChange={(e) => updateField("material", Number(e.target.value))}
          >
            {materials.map((material, index) => (
              <option value={material.Value} key={material.Value}>
                {material.Key}
              </option>
            ))}
          </select>
        </div>
        {densityArray && densityArray?.length > 0 && (
          <>
            <div className="wrapper-selector">
              <label htmlFor="density">Плотность:</label>
              <select
                id="density"
                required
                value={selectedState.density}
                onChange={(event) =>
                  updateField("density", Number(event.target.value))
                }
              >
                <option
                  value=""
                  disabled
                  selected
                  hidden
                  style={{ color: "#9c9c9c" }}
                >
                  Выберите плотность
                </option>
                {densityArray.map((el, index) => (
                  <option value={el} key={el + index}>
                    {el}
                  </option>
                ))}
              </select>
            </div>
            {/* <p className="notify">Зависит от материала!</p> */}
          </>
        )}
        {formatArray && formatArray?.length > 0 && (
          <>
            <div className="wrapper-selector">
              <label htmlFor="format">Формат:</label>
              <select
                required
                id="format"
                value={selectedState.format}
                onChange={(event) =>
                  updateField("format", Number(event.target.value))
                }
              >
                <option
                  value=""
                  disabled
                  selected
                  hidden
                  style={{ color: "#9c9c9c" }}
                >
                  Выберите формат
                </option>
                {formatArray.map((el, index) => (
                  <option value={el.Value} key={el.Value + index}>
                    {el.Key}
                  </option>
                ))}
              </select>
            </div>
            {/* <p className="notify">Зависит от материала!</p> */}
          </>
        )}
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
        <div className="wrapper-picker">
          <label htmlFor="lock">Залочить при поставновке в график</label>
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
                <input
                  id="hours-time"
                  type="time"
                  name="hours-time"
                  required={!autoTaskTime}
                  placeholder="0"
                  value={createTime}
                  style={{ width: "110px" }}
                  onChange={(event) => setCreateTime(event.target.value)}
                />
                {/* <label htmlFor="minutes-time">Минуты</label>
                <input
                  id="minutes-time"
                  type="time"
                  min={0}
                  required={!autoTaskTime}
                  value={createTime.minutes}
                  onChange={(event) =>
                    setCreateTime((prev) => ({
                      ...prev,
                      minutes: event.target.value,
                    }))
                  }
                  max={59}
                  maxLength={2}
                  name="minutes-time"
                  placeholder="0"
                /> */}
              </div>
            )}
          </div>
        )}
        <div className="buttons">
          {autoTime && (
            <button
              type="submit"
              className="buttons-addList"
              disabled={isLoading}
              onClick={() => setPublish(false)}
            >
              Добавить в список
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={!autoTime ? { margin: "0 auto" } : {}}
            className="buttons-addCalendar"
            onClick={() => setPublish(true)}
          >
            Поставить в график
          </button>
        </div>
      </form>
    </Modal>
  );
};
