import { IListTask } from "../../../api/apiTypes";
import { FC, FormEvent, useEffect, useState } from "react";
import "./componentsCalendar.css";
import { Modal } from "../../../components/Modal";
import { useAppSelector } from "../../../store/hooks";
import { selectUser } from "../../../selectors";
import {
  useDeleteTaskMutation,
  useLockTaskMutation,
} from "../../../api/calendarServices";
import toast from "react-hot-toast";

interface IInfoTaskModal {
  isOpen: boolean;
  onClose: () => void;
  task: IListTask;
}

export const ModalTaskInfo: FC<IInfoTaskModal> = ({
  isOpen,
  onClose,
  task,
}) => {
  const { userId } = useAppSelector(selectUser);
  const [deleteTask] = useDeleteTaskMutation();
  const [lockTask] = useLockTaskMutation();
  const [taskName, setTaskName] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    setTaskName(task.name);
    setComment(task.optionalComment);
  }, [task]);

  const submitFormData = (event: FormEvent) => {
    event.preventDefault();
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

  const handleLock = () => {
    lockTask({ userId: Number(userId), taskId: task.id })
      .unwrap()
      .then((data) => {
        toast.success(data.optionalAlertMessage);
        onClose();
      })
      .catch((err) => toast.error(err.data.optionalAlertMessage));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form className="wrapper" onSubmit={submitFormData}>
        <h2>Детали задачи</h2>
        <div className="wrapper-selector" style={{ height: "min-content" }}>
          <label htmlFor="taskName">Название:</label>
          <p
            title={task.name}
            style={{
              fontWeight: "bold",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {task.name}
          </p>
        </div>
        <div className="wrapper-selector" style={{ height: "min-content" }}>
          <label htmlFor="description">Описание:</label>
          <p style={{ fontWeight: "bold" }}>{task.description}</p>
        </div>
        <div className="wrapper-selector" style={{ height: "min-content" }}>
          <label htmlFor="lock">Статус:</label>
          <p style={{ fontWeight: "bold" }}>
            {task.isLocked ? "залочена" : "не залочена"}
          </p>
        </div>
        <div className="wrapper-comment">
          <label htmlFor="comment">
            Комментарий печатнику:{" "}
            <span id="comment" style={{ fontWeight: "bold" }}>
              {comment ? comment : "Нет комментария"}
            </span>
          </label>
          {/* <textarea id="comment" value={comment} disabled /> */}
        </div>
        {!task.isCompleted ? (
          <>
            <div className="buttons">
              <button
                type="submit"
                className="buttons-delete"
                onClick={handleLock}
              >
                {task.isLocked ? "Разлочить" : "Залочить"}
              </button>
              {!task.isLocked && (
                <button
                  type="submit"
                  className="buttons-addCalendar"
                  onClick={handleDelete}
                >
                  Вернуть в лист ожидания
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="buttons">
            <span
              style={{ textAlign: "center", fontWeight: "bold", color: "gray" }}
            >
              Задача завершена и будет архивирована автоматически
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
};
