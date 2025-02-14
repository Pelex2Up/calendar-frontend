import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Timeline, {
  DateHeader,
  OnItemDragObjectMove,
  TimelineHeaders,
} from "react-calendar-timeline";
import "react-calendar-timeline/style.css";
import moment from "moment";
import { CalendarDataItemT } from "../../types/common";
import "./calendar.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logoutState } from "../../store/redux/user/slice";
import { selectUser } from "../../selectors";
import {
  useGetCalendarDataQuery,
  useGetPaperParamsMutation,
  useGetTasksListQuery,
  useMoveTaskMutation,
  useResizeWorkTimeMutation,
} from "../../api/calendarServices";
import { ModalCreateTask } from "./components/modalCreateTask";
import { CalendarDataT, IListTask } from "../../api/apiTypes";
import { ModalTaskDetails } from "./components/modalTaskDetails";
import { ModalTaskInfo } from "./components/modalTaskInfo";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import { itemRenderer } from "./components/itemRenderer";
import { Loader } from "../../components/Loader";
import { Twirl as Hamburger } from "hamburger-react";

interface IOnItemResize {
  eventType: "resize";
  itemId: number;
  time: number;
  edge: "right" | "left";
}

interface Message {
  name: string;
  message: string;
}

export const CalendarPage: FC = () => {
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const start = useMemo(() => moment().startOf("day").valueOf(), []);
  const [wideList, setWideList] = useState<boolean>(false);
  const { userId, orgId } = useAppSelector(selectUser);
  const {
    data: calendarData,
    isFetching,
    isError: errCalendar,
    refetch: refetchCalendar,
  } = useGetCalendarDataQuery({
    userId: Number(userId),
  });
  const {
    data: tasks,
    isFetching: fetchingTasks,
    isError: errTasks,
    refetch: refetchTasks,
  } = useGetTasksListQuery(Number(userId));
  const [getPaperData, { data: paperParams, isLoading, isError: errPaper }] =
    useGetPaperParamsMutation();
  const [moveTask, { isLoading: movingTask }] = useMoveTaskMutation();
  const [resizeTask, { isLoading: resizingTask }] = useResizeWorkTimeMutation();
  const dispatch = useAppDispatch();
  const [zoomUnit, setZoomUnit] = useState<string>("hour");
  const [show, setShow] = useState<boolean>(false);
  const end = useMemo(
    () => moment().startOf("day").add(1, "day").valueOf(),
    []
  );
  // const [visibleTime, setVisibleTime] = useState<number>(start);
  const [groups, setGroups] = useState<any[]>([
    { id: 1, title: "Загрузка машин" },
  ]);
  const [items, setItems] = useState<CalendarDataItemT[]>([]);
  const [list, setList] = useState<IListTask[]>([]);
  const [taskModal, setTaskModal] = useState<boolean>(false);
  const [detailsModal, setDetailsModal] = useState<boolean>(false);
  const [infoModal, setInfoModal] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<IListTask>();
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (errCalendar && !calendarData && !isFetching) {
        refetchCalendar();
      } else if (errPaper && !paperParams && !isLoading) {
        getPaperData({ userId: userId, companyId: orgId });
      } else if (errTasks && !tasks && !fetchingTasks) {
        refetchTasks();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    errCalendar,
    errPaper,
    errTasks,
    calendarData,
    isFetching,
    paperParams,
    isLoading,
    userId,
    orgId,
    tasks,
    fetchingTasks,
    refetchCalendar,
    getPaperData,
    refetchTasks,
  ]);

  useEffect(() => {
    const animationId = requestAnimationFrame(() => setDate(new Date()));

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [date]);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(() => {
    if (!paperParams && !isLoading && userId && orgId) {
      getPaperData({ userId: userId, companyId: orgId });
    }
  }, [userId, orgId, selectedTaskId, paperParams]);

  useEffect(() => {
    if (calendarData) {
      const machinesArray = calendarData.listOfMachinesWithData.map((item) => ({
        title: item.machineName,
        id: item.machineId,
      }));
      setGroups(machinesArray);

      const calendarItems: CalendarDataItemT[] =
        calendarData.listOfMachinesWithData
          .flatMap((machine) =>
            machine.listOfOrders.map((task) => ({
              id: task.id,
              group: task.machineId,
              title: task.name,
              start_time: moment(task.isoStartTime).valueOf(),
              end_time: moment(task.isoEndTime).valueOf(),
              breakTime: task.isTimeTask,
              canDelete: task.canDelete,
              canResize: task.canStretch
                ? ("both" as "both" | "left" | "right")
                : false,
              description: task.description,
              canMove: task.canMove, // Пример, можно настроить
              // canResize: false, // Пример, можно настроить
              className: "custom-class", // Пример, можно настроить
              bgColor: task.hexColor,
              selectedBgColor: task.hexColor,
              color: "#000000", // Пример, можно настроить
              itemProps: {}, // Дополнительные свойства, если нужно
            }))
          )
          .sort((a, b) => {
            // Сортируем по полю group (machineId)
            if (a.group < b.group) return -1;
            if (a.group > b.group) return 1;
            return 0;
          });

      setItems(calendarItems);
    }
  }, [calendarData]);

  useEffect(() => {
    if (tasks) {
      setList(tasks);
    }
  }, [tasks]);

  useEffect(() => {
    const eventSource = new EventSource(`/sse/connect?userId=${userId}`);

    eventSource.addEventListener("updateList", (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      setList(data);
    });

    eventSource.addEventListener("updateCalendar", (event: MessageEvent) => {
      const data: CalendarDataT = JSON.parse(event.data);
      const calendarItems: CalendarDataItemT[] = data.listOfMachinesWithData
        .flatMap((machine) =>
          machine.listOfOrders.map((task) => ({
            id: task.id,
            group: task.machineId,
            title: task.name,
            start_time: moment(task.isoStartTime).valueOf(),
            end_time: moment(task.isoEndTime).valueOf(),
            breakTime: task.isTimeTask,
            canDelete: task.canDelete,
            canResize: task.canStretch
              ? ("both" as "both" | "left" | "right")
              : false,
            canMove: task.canMove,
            description: task.description,
            className: "custom-class", // НАСТРОИТЬ!!!
            bgColor: task.hexColor,
            selectedBgColor: task.hexColor, // если залочена задача, то бэкграунд красный, иначе из джейсона
            color: "#000000", // НАСТРОИТЬ!!!
            itemProps: {}, // Дополнительные свойства, если нужно
          }))
        )
        .sort((a, b) => {
          // Сортируем по полю group (machineId)
          if (a.group < b.group) return -1;
          if (a.group > b.group) return 1;
          return 0;
        });
      setItems(calendarItems);
    });

    eventSource.addEventListener(
      "updateCalendarSelected",
      (event: MessageEvent) => {
        const data: CalendarDataT = JSON.parse(event.data);

        // Получаем список обновленных машин
        const updatedMachines = data.listOfMachinesWithData;

        // Обновляем только те элементы, которые относятся к обновленным машинам
        setItems((prevItems) => {
          // Фильтруем старые элементы, удаляя те, которые относятся к обновленным машинам
          const filteredItems = prevItems.filter(
            (item) =>
              !updatedMachines.some(
                (machine) => machine.machineId === item.group
              )
          );

          // Создаем новые элементы для обновленных машин
          const newItems = updatedMachines.flatMap((machine) =>
            machine.listOfOrders.map((task) => ({
              id: task.id,
              group: task.machineId,
              title: task.name,
              start_time: moment(task.isoStartTime).valueOf(),
              end_time: moment(task.isoEndTime).valueOf(),
              breakTime: task.isTimeTask,
              canDelete: task.canDelete,
              canResize: task.canStretch
                ? ("both" as "both" | "left" | "right")
                : false,
              canMove: task.canMove,
              description: task.description,
              className: "custom-class",
              bgColor: task.hexColor,
              selectedBgColor: task.hexColor,
              color: "#000000",
              itemProps: {},
            }))
          );

          // Объединяем отфильтрованные старые элементы с новыми
          const updatedItems = [...filteredItems, ...newItems].sort((a, b) => {
            if (a.group < b.group) return -1;
            if (a.group > b.group) return 1;
            return 0;
          });

          return updatedItems;
        });
      }
    );

    eventSource.onerror = (error: Event) => {
      console.error("EventSource connection failed:", error);
      eventSource.close();
    };
    eventSource.onopen = () => {
      console.info("EVENT CONNECTED SUCCESSFULY");
    };

    return () => {
      console.info("CLOSING EventSource");
      eventSource.close();
    };
  }, [userId]);

  const sendMoveTask = useCallback(
    debounce((dragParams) => {
      if (groups) {
        const targetGroup = groups[dragParams.newGroupOrder].id;

        moveTask({
          userId: userId,
          toMachineId: Number(targetGroup),
          newTimeStamp: dragParams.time / 1000,
          taskId: Number(dragParams.itemId),
        })
          .unwrap()
          .then((data) => toast.success(data.optionalAlertMessage))
          .catch((err) => toast.error(err.data.optionalAlertMessage));
      }
    }, 500),
    [userId, groups]
  );

  const sendResizeTask = useCallback(
    debounce((task: CalendarDataItemT) => {
      if (groups) {
        resizeTask({
          userId: Number(userId),
          taskId: task.id,
          machineId: Number(task.group),
          unixStartTime: task.start_time / 1000,
          unixEndTime: task.end_time / 1000 - 300,
        })
          .unwrap()
          .then((data) => toast.success(data.optionalAlertMessage))
          .catch((err) => toast.error(err.data.optionalAlertMessage));
      }
    }, 500),
    [userId, groups]
  );

  const dragItem = (dragParams: OnItemDragObjectMove | IOnItemResize) => {
    if (dragParams.eventType === "move") {
      const updatedItems = items.map((item, index) => {
        if (item.id === dragParams.itemId) {
          return {
            ...item,
            start_time: item.start_time,
            end_time: item.end_time,
          };
        }
        return item;
      });
      setItems(updatedItems);
      sendMoveTask(dragParams);
    } else if (dragParams.eventType === "resize") {
      let task: CalendarDataItemT | null = null;
      const updatedItems = items.map((item, index) => {
        if (item.id === dragParams.itemId) {
          task = {
            ...item,
            start_time:
              dragParams.edge === "left" ? dragParams.time : item.start_time,
            end_time:
              dragParams.edge === "right" ? dragParams.time : item.end_time,
          };
          return {
            ...item,
            start_time: item.start_time,
            end_time:
              dragParams.edge === "right"
                ? dragParams.time <= items[index + 1].start_time
                  ? dragParams.time
                  : items[index + 1].start_time
                : item.end_time,
          };
        }
        return item;
      });
      setItems(updatedItems);
      if (task) {
        sendResizeTask(task);
      }
    }
  };

  const contextClick = (itemId: number) => {
    const task = list.find((item) => item.id === itemId || -item.id === itemId);
    if (task) showAddDetailsModal(task);
  };

  const showAddTaskModal = () => {
    setTaskModal(!taskModal);
  };

  const showAddDetailsModal = (task?: IListTask) => {
    if (task) {
      setSelectedTaskId(task);
    }
    if (detailsModal || infoModal) {
      setDetailsModal(false);
      setInfoModal(false);
    }
    if (task?.isWaiting) {
      setDetailsModal(!detailsModal);
    } else if (task?.isCompleted || task?.isProcessing) {
      setInfoModal(!infoModal);
    }
  };

  if (groups.length === 0) {
    return <></>;
  }

  // Высота заголовков
  const headerHeight = 60 + 60 + (zoomUnit === "hour" ? 40 : 0);

  // Доступная высота для строк
  const availableHeight = containerHeight - headerHeight;

  // Высота строки
  const lineHeight = availableHeight / groups.length - 10;

  return (
    <div
      style={{
        position: "relative",
        maxWidth: "calc(100vw - 2rem)",
        width: "100%",
        minHeight: "calc(100vh - 2rem)",
        height: "auto",
        display: "flex",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      {(isLoading || isFetching || movingTask || resizingTask) && <Loader />}
      <div style={{ padding: "0 30px 0 0" }}>
        <motion.div
          layout
          style={{
            border: "1px solid rgba(128, 128, 128, 0.107)",
            borderRadius: "0.5rem",
            padding: show ? "1rem" : "0.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: show ? "" : "center",
            gap: "1rem",
            overflow: "hidden",
            maxHeight: "calc(100vh - 4rem)",
            position: "relative",
          }}
          animate={{
            height: show ? "auto" : "32px",
            width: show ? (wideList ? "600px" : "300px") : "32px",
            borderRadius: show ? "0.5rem" : "50%",
          }}
          transition={{ duration: 0.5 }}
          onClick={() => (!show ? setShow(true) : null)}
        >
          <motion.div
            style={
              show
                ? {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }
                : {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }
            }
          >
            <Hamburger toggled={show} toggle={setShow} size={25} />
            {show && (
              <motion.button onClick={() => setWideList(!wideList)}>
                {wideList ? "← Свернуть" : "Раскрыть →"}
              </motion.button>
            )}
          </motion.div>

          {/* Список */}
          <AnimatePresence>
            {show && (
              <motion.ul
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  margin: 0,
                  padding: 0,
                  overflow: "scroll",
                }}
              >
                {list.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="listItem"
                    style={
                      item.isLocked
                        ? { background: "#ff8d8d", borderRadius: "10px" }
                        : {}
                    }
                    onClick={() => showAddDetailsModal(item)}
                  >
                    <div
                      style={
                        item.isCompleted
                          ? {
                              minWidth: "10px",
                              minHeight: "10px",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: "gray",
                            }
                          : item.isWaiting
                          ? {
                              minWidth: "10px",
                              minHeight: "10px",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: "orange",
                            }
                          : {
                              minWidth: "10px",
                              minHeight: "10px",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: "green",
                            }
                      }
                    />
                    <span
                      className={
                        wideList ? "listItemTitleShort" : "listItemTitle"
                      }
                    >
                      {item.name +
                        `${wideList ? ` | ${item.description}` : ""}`}
                    </span>
                    {item.isCompleted ? (
                      <svg
                        width={24}
                        height={24}
                        focusable="false"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        data-testid="InfoOutlinedIcon"
                      >
                        <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8"></path>
                      </svg>
                    ) : (
                      <svg
                        width={24}
                        height={24}
                        focusable="false"
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        data-testid="SettingsIcon"
                      >
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6"></path>
                      </svg>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          {show && (
            <motion.div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <motion.button
                style={{ display: "flex", gap: "3px", alignItems: "center" }}
                onClick={() => dispatch(logoutState())}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  fill="#000000"
                  height="15px"
                  width="15px"
                  version="1.1"
                  id="Capa_1"
                  viewBox="0 0 471.2 471.2"
                  xmlSpace="preserve"
                >
                  <g>
                    <g>
                      <path d="M227.619,444.2h-122.9c-33.4,0-60.5-27.2-60.5-60.5V87.5c0-33.4,27.2-60.5,60.5-60.5h124.9c7.5,0,13.5-6,13.5-13.5    s-6-13.5-13.5-13.5h-124.9c-48.3,0-87.5,39.3-87.5,87.5v296.2c0,48.3,39.3,87.5,87.5,87.5h122.9c7.5,0,13.5-6,13.5-13.5    S235.019,444.2,227.619,444.2z" />
                      <path d="M450.019,226.1l-85.8-85.8c-5.3-5.3-13.8-5.3-19.1,0c-5.3,5.3-5.3,13.8,0,19.1l62.8,62.8h-273.9c-7.5,0-13.5,6-13.5,13.5    s6,13.5,13.5,13.5h273.9l-62.8,62.8c-5.3,5.3-5.3,13.8,0,19.1c2.6,2.6,6.1,4,9.5,4s6.9-1.3,9.5-4l85.8-85.8    C455.319,239.9,455.319,231.3,450.019,226.1z" />
                    </g>
                  </g>
                </svg>
                Выйти
              </motion.button>

              <button onClick={showAddTaskModal} disabled={!paperParams}>
                Добавить задачу
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxHeight: "calc(100vh - 4rem)",
          borderRadius: "1rem",
          overflow: "hidden",
        }}
      >
        <div>{date?.toLocaleTimeString()}</div>
        {groups.length > 0 && dragItem && itemRenderer && (
          <Timeline
            groups={groups}
            lineHeight={lineHeight}
            dragSnap={5 * 60 * 1000}
            items={items}
            onItemDrag={dragItem}
            defaultTimeStart={start}
            defaultTimeEnd={end}
            stackItems={true}
            onItemContextMenu={(itemId) => contextClick(Number(itemId))}
            onZoom={(context, unit) => {
              setZoomUnit(unit);
            }}
            minZoom={6 * 60 * 60 * 1000} // 6 hours
            maxZoom={7 * 24 * 60 * 60 * 1000} // 7 days
            sidebarWidth={150}
            itemRenderer={itemRenderer}
            timeSteps={{
              second: 0,
              minute: 5,
              hour: 1,
              day: 1,
              month: 1,
              year: 1,
            }}
            itemHeightRatio={1}
            style={{ height: "100%" }}
          >
            <TimelineHeaders>
              <DateHeader
                height={60}
                className="mainHeader"
                unit="primaryHeader"
                labelFormat={(date) => {
                  if (zoomUnit === "hour") {
                    return moment(date[0].toISOString()).format("LL");
                  } else {
                    return "";
                  }
                }}
              />
              <DateHeader
                height={60}
                unit="day"
                labelFormat={(date) => {
                  if (zoomUnit === "hour") {
                    return `${moment(date[0].toISOString())
                      .format("dddd")
                      .toUpperCase()}`;
                  } else
                    return `${moment(date[0].toISOString())
                      .format("dd")
                      .toUpperCase()}, ${moment(date[0].toISOString()).format(
                      "LL"
                    )}`;
                }}
              />
              {zoomUnit === "hour" && (
                <DateHeader
                  height={40}
                  unit="hour"
                  labelFormat={(date) => {
                    return `${moment(date[0].toISOString())
                      .format("HH:mm")
                      .toUpperCase()}`;
                  }}
                />
              )}
            </TimelineHeaders>
          </Timeline>
        )}
      </div>

      {paperParams && (
        <ModalCreateTask
          machines={paperParams.allMachinesWithIds}
          materials={paperParams.allPaperTypesAndValuesList}
          formats={paperParams.allFormatSizesAndValuesList}
          density={paperParams.allDensityListForEachPaperType}
          isOpen={taskModal}
          onClose={showAddTaskModal}
        />
      )}
      {paperParams && selectedTaskId && (
        <ModalTaskDetails
          machines={paperParams.allMachinesWithIds}
          isOpen={detailsModal}
          onClose={showAddDetailsModal}
          task={selectedTaskId}
        />
      )}
      {selectedTaskId && (
        <ModalTaskInfo
          isOpen={infoModal}
          onClose={showAddDetailsModal}
          task={selectedTaskId}
        />
      )}
    </div>
  );
};
