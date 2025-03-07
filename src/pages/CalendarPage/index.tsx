import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Timeline, {
  DateHeader,
  OnItemDragObjectMove,
  TimelineHeaders,
  TimelineMarkers,
  TodayMarker,
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
  useResizeTaskMutation,
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

export const CalendarPage: FC = () => {
  const timelineRef = useRef<any>();
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
  const [visibleTimeStart, setVisibleTimeStart] = useState(
    moment().startOf("day").valueOf()
  );
  const [visibleTimeEnd, setVisibleTimeEnd] = useState(
    moment().startOf("day").add(1, "day").valueOf()
  );
  const [getPaperData, { data: paperParams, isLoading, isError: errPaper }] =
    useGetPaperParamsMutation();
  const [moveTask, { isLoading: movingTask }] = useMoveTaskMutation();
  const [resizeTask, { isLoading: resizingTask }] = useResizeWorkTimeMutation();
  const [resizeCalendarTask, { isLoading: resizingCalendarTask }] =
    useResizeTaskMutation();
  const dispatch = useAppDispatch();
  const [zoomUnit, setZoomUnit] = useState<string>("hour");
  const [show, setShow] = useState<boolean>(false);
  const end = useMemo(
    () => moment().startOf("day").add(1, "day").valueOf(),
    []
  );
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
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [sseConnection, setSseConnection] = useState<EventSource>();

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
              isTimeTask: task.isTimeTask,
              id: task.id,
              group: task.machineId,
              title: task.name,
              start_time: moment(task.isoStartTime).valueOf(),
              end_time: moment(task.isoEndTime).valueOf(),
              breakTime: task.isTimeTask,
              canDelete: task.canDelete,
              parentId: task.parentId || false,
              canResize: task.canStretch
                ? ("both" as "both" | "left" | "right")
                : false,
              isProcessing: task.isProcessing,
              isCompleted: task.isCompleted,
              description: task.description,
              isLocked: task.isLocked,
              canMove: task.canMove,
              className: "custom-class",
              bgColor: task.hexColor,
              selectedBgColor: task.hexColor,
              color: "#ffffff",
              itemProps: {}, // Дополнительные свойства, если нужно
            }))
          )
          .sort((a, b) => {
            // Сортируем по полю group (machineId) !!!! НЕ УБИРАТЬ
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
    const connectSSE = () => {
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
              isTimeTask: task.isTimeTask,
              id: task.id,
              group: task.machineId,
              title: task.name,
              start_time: moment(task.isoStartTime).valueOf(),
              end_time: moment(task.isoEndTime).valueOf(),
              breakTime: task.isTimeTask,
              canDelete: task.canDelete,
              isProcessing: task.isProcessing,
              isCompleted: task.isCompleted,
              isLocked: task.isLocked,
              canResize: task.canStretch
                ? ("both" as "both" | "left" | "right")
                : false,
              canMove: task.canMove,
              description: task.description,
              parentId: task.parentId || false,
              className: "custom-class",
              bgColor: task.hexColor,
              selectedBgColor: task.hexColor,
              color: "#ffffff",
              itemProps: {}, // Дополнительные свойства, если нужно
            }))
          )
          .sort((a, b) => {
            // Сортируем по полю group (machineId) !!! НЕ УБИРАТЬ
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

          const updatedMachines = data.listOfMachinesWithData;
          setItems((prevItems) => {
            const filteredItems = prevItems.filter(
              (item) =>
                !updatedMachines.some(
                  (machine) => machine.machineId === item.group
                )
            );

            const newItems = updatedMachines.flatMap((machine) =>
              machine.listOfOrders.map((task) => ({
                isTimeTask: task.isTimeTask,
                id: task.id,
                isLocked: task.isLocked,
                group: task.machineId,
                title: task.name,
                parentId: task.parentId || false,
                start_time: moment(task.isoStartTime).valueOf(),
                end_time: moment(task.isoEndTime).valueOf(),
                breakTime: task.isTimeTask,
                canDelete: task.canDelete,
                isProcessing: task.isProcessing,
                isCompleted: task.isCompleted,
                canResize: task.canStretch
                  ? ("both" as "both" | "left" | "right")
                  : false,
                canMove: task.canMove,
                description: task.description,
                className: "custom-class",
                bgColor: task.hexColor,
                selectedBgColor: task.hexColor,
                color: "#ffffff",
                itemProps: {},
              }))
            );

            const updatedItems = [...filteredItems, ...newItems].sort(
              (a, b) => {
                if (a.group < b.group) return -1;
                if (a.group > b.group) return 1;
                return 0;
              }
            );

            return updatedItems;
          });
        }
      );

      eventSource.onerror = (error: Event) => {
        console.error("EventSource connection failed:", error);
        eventSource.close();
      };

      eventSource.addEventListener("updateBusyStaus", (event: MessageEvent) => {
        const data: { lockUi: boolean; optionalMessage: string } = JSON.parse(
          event.data
        );
        setIsBusy(data.lockUi);
        if (data.lockUi)
          toast.loading(data.optionalMessage, { duration: 5000 });
      });

      eventSource.onopen = () => {
        console.log("EventSource connected!");
        setSseConnection(eventSource);
      };

      return eventSource;
    };

    if (!sseConnection || sseConnection.readyState === EventSource.CLOSED) {
      setSseConnection(connectSSE());
    }

    return () => {
      if (sseConnection) {
        console.info("CLOSING EventSource");
        sseConnection.close();
      }
    };
  }, [userId, sseConnection]);

  const sendMoveTask = useCallback(
    debounce(
      (dragParams) => {
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
      },
      isDragging ? 5000 : 1200
    ),
    [userId, groups]
  );

  const sendResizeTask = useCallback(
    debounce((task: CalendarDataItemT) => {
      if (groups) {
        if (task.isTimeTask) {
          resizeTask({
            userId: Number(userId),
            taskId: task.id,
            machineId: Number(task.group),
            unixStartTime: task.start_time / 1000,
            // рассчеты костылей для бэкенда
            unixEndTime: task.end_time / 1000,
            // unixEndTime:
            //   (task.end_time - task.start_time) / 1000 !== 300
            //     ? task.end_time / 1000 - 300
            //     : task.start_time / 1000 + 300,
          })
            .unwrap()
            .then((data) => toast.success(data.optionalAlertMessage))
            .catch((err) => toast.error(err.data.optionalAlertMessage));
        } else {
          resizeCalendarTask({
            userId: Number(userId),
            taskId: task.id,
            unixStartTime: task.start_time / 1000,
            // рассчеты костылей для бэкенда
            unixEndTime:
              task.start_time === task.end_time
                ? task.start_time / 1000
                : task.end_time / 1000 - 300,
          })
            .unwrap()
            .then((data) => toast.success(data.optionalAlertMessage))
            .catch((err) => toast.error(err.data.optionalAlertMessage));
        }
      }
    }, 1200),
    [userId, groups]
  );

  const dragItem = (dragParams: OnItemDragObjectMove | IOnItemResize) => {
    if (dragParams.eventType === "move") {
      const updatedItems = items.map((item) => {
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
    if (task) {
      showAddDetailsModal(task);
    } else {
      const calendarItem = items.find((item) => item.id === itemId);
      if (calendarItem && "parentId" in calendarItem) {
        const item = list.find(
          (item) => Number(calendarItem.parentId) === item.id
        );
        if (item) showAddDetailsModal(item);
      }
    }
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
    console.log(task);
    if (task && "isWaiting" in task && task.isWaiting) {
      setDetailsModal(!detailsModal);
    } else if (task && (task.isCompleted || task.isProcessing)) {
      setInfoModal(!infoModal);
    }
  };

  useEffect(() => {
    const sidebarHeader = document.querySelector(
      '[data-testid="sidebarHeader"]'
    );
    if (sidebarHeader) {
      sidebarHeader.className = "headerSidebar";
      const existingImg = sidebarHeader.querySelector(
        'img[data-img-id="logotype"]'
      );
      if (!existingImg) {
        const img = document.createElement("img");
        img.src = "/src/pages/LoginPage/assets/photo%20(1).png";
        img.alt = "logo";
        img.setAttribute("data-img-id", "logotype");
        sidebarHeader.appendChild(img);
        img.style.cursor = "pointer";
        img.addEventListener("click", moveToday);
        const timer = document.createElement("div");
        timer.id = "current-time-clock";
        timer.className = "clock-timer";
        sidebarHeader.appendChild(timer);
      }
    }
  }, []);

  const updateClock = () => {
    const timer = document.querySelector("#current-time-clock");
    if (timer) {
      const hours = moment().hours();
      const minutes = moment().minutes();
      const time = `${String(hours).padStart(
        2,
        "0"
      )}<span class="blinking">:</span>${String(minutes).padStart(2, "0")}`;
      timer.innerHTML = time;
    }
  };

  const moveToday = () => {
    setVisibleTimeStart(moment().valueOf() - 1000 * 60 * 60 * 24); // 1 день назад
    setVisibleTimeEnd(moment().valueOf() + 1000 * 60 * 60 * 24); // 1 день вперед
  };

  useEffect(() => {
    setInterval(updateClock, 3000);
    updateClock();
  }, []);

  if (groups.length === 0) {
    return <></>;
  }

  // Высота заголовков
  const headerHeight = 91.11;

  // Доступная высота для строк
  const availableHeight = containerHeight - headerHeight;

  // Высота строки
  const lineHeight = availableHeight / groups.length;

  return (
    <div
      style={{
        position: "relative",
        maxWidth: "100vw",
        width: "100%",
        minHeight: "100vh",
        height: "auto",
        display: "flex",
        gap: "1rem",
      }}
    >
      {(isLoading ||
        isFetching ||
        movingTask ||
        resizingTask ||
        resizingCalendarTask ||
        isBusy) && <Loader />}
      <div
        style={
          window.innerWidth > 1280 ? { padding: "0 30px 0 0" } : { padding: 0 }
        }
      >
        <motion.div
          layout
          style={{
            margin: "1rem -2rem 0 1rem",
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
                className="tasks-list"
              >
                {list.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="listItem"
                    onClick={() => showAddDetailsModal(item)}
                  >
                    <div
                      style={
                        item.isLocked
                          ? {
                              minWidth: "20px",
                              minHeight: "20px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: item.hexColor,
                            }
                          : item.isCompleted
                          ? {
                              minWidth: "20px",
                              minHeight: "20px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: item.hexColor,
                            }
                          : item.isWaiting
                          ? {
                              minWidth: "20px",
                              minHeight: "20px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: item.hexColor,
                            }
                          : {
                              minWidth: "20px",
                              minHeight: "20px",
                              width: "20px",
                              height: "0px",
                              borderRadius: "50%",
                              background: item.hexColor,
                            }
                      }
                    />
                    <span
                      className={
                        wideList ? "listItemTitleShort" : "listItemTitle"
                      }
                    >
                      {item.name +
                        `${
                          wideList
                            ? ` | ${
                                item.isProcessing
                                  ? item.description +
                                    " | " +
                                    item.publishedDateTimeInfo
                                  : item.description
                              }`
                            : ""
                        }`}
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
          minWidth: "90vw",
          height: "100vh",
          maxHeight: "100vh",
          borderRadius: "0.5rem 0 0 0.5rem",
          overflow: "hidden",
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {groups.length > 0 && dragItem && itemRenderer && (
          <Timeline
            groups={groups}
            ref={timelineRef}
            lineHeight={lineHeight}
            dragSnap={5 * 60 * 1000}
            items={items}
            onTimeChange={(visibleTimeStart, visibleTimeEnd) => {
              setVisibleTimeStart(visibleTimeStart);
              setVisibleTimeEnd(visibleTimeEnd);
            }}
            onItemDrag={dragItem}
            defaultTimeStart={start}
            visibleTimeEnd={visibleTimeEnd}
            visibleTimeStart={visibleTimeStart}
            defaultTimeEnd={end}
            onItemContextMenu={(itemId) => contextClick(Number(itemId))}
            onZoom={(context, unit) => {
              console.log(context);
              setZoomUnit(unit);
            }}
            traditionalZoom
            maxZoom={7 * 24 * 60 * 60 * 1000} // 7 days
            sidebarWidth={window.innerWidth > 1280 ? 100 : 80}
            itemRenderer={itemRenderer}
            timeSteps={{
              second: 30,
              minute: 10,
              hour: 1,
              day: 1,
              month: 1,
              year: 1,
            }}
            itemHeightRatio={1}
            style={{ height: "100%" }}
          >
            <TimelineHeaders>
              {/* <DateHeader
                height={40}
                className="mainHeader"
                unit="primaryHeader"
                labelFormat={(date) => {
                  if (zoomUnit === "hour") {
                    return moment(date[0].toISOString()).format("LL");
                  } else {
                    return "";
                  }
                }}
              /> */}
              <DateHeader
                height={50}
                unit="day"
                intervalRenderer={({ getIntervalProps, intervalContext }) => {
                  return (
                    <div
                      {...getIntervalProps()}
                      className={
                        intervalContext.intervalText ===
                          `${moment()
                            .startOf("day")
                            .format("dddd")
                            .toUpperCase()} | ${moment()
                            .startOf("day")
                            .format("LL")}` ||
                        intervalContext.intervalText ===
                          `${moment()
                            .startOf("day")
                            .format("dd")
                            .toUpperCase()} | ${moment()
                            .startOf("day")
                            .format("LL")}`
                          ? "day-header-now"
                          : "day-header"
                      }
                    >
                      {intervalContext.intervalText}
                    </div>
                  );
                }}
                labelFormat={(date) => {
                  if (zoomUnit === "hour") {
                    return `${moment(date[0].toISOString())
                      .format("dddd")
                      .toUpperCase()} | ${moment(date[0].toISOString()).format(
                      "LL"
                    )}`;
                  } else
                    return `${moment(date[0].toISOString())
                      .format("dd")
                      .toUpperCase()} | ${moment(date[0].toISOString()).format(
                      "LL"
                    )}`;
                }}
              />

              <DateHeader
                height={40}
                unit="hour"
                labelFormat={(date) => {
                  if (zoomUnit === "hour") {
                    return `${moment(date[0].toISOString())
                      .format("HH:mm")
                      .toUpperCase()}`;
                  } else
                    return `${moment(date[0].toISOString())
                      .format("HH")
                      .toUpperCase()}`;
                }}
              />
            </TimelineHeaders>
            <TimelineMarkers>
              <TodayMarker interval={20 * 1000}>
                {({ styles }) => {
                  const customStyles = {
                    ...styles,
                    backgroundColor: "red",
                    zIndex: 99,
                  };
                  return <div style={customStyles} />;
                }}
              </TodayMarker>
            </TimelineMarkers>
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
          materials={paperParams.allPaperTypesAndValuesList}
          formats={paperParams.allFormatSizesAndValuesList}
          density={paperParams.allDensityListForEachPaperType}
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
