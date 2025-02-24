import { createApi } from "@reduxjs/toolkit/dist/query/react";
import { baseQueryWithReauth } from "./baseApiWithReauth";
import { CalendarDataT, IListTask, IPaperParams } from "./apiTypes";

export const calendarService = createApi({
  reducerPath: "calendarService",
  baseQuery: baseQueryWithReauth,
  endpoints: (build) => ({
    getTasksList: build.query<IListTask[], number>({
      query: (id) => `/GetFrontendOrdersList?companyId=1&userId=${id}`,
    }),
    getPaperParams: build.mutation<
      IPaperParams,
      { userId: number; companyId: number }
    >({
      query: (payload) => ({
        url: `/GetNewFormData/?userId=${payload.userId}&companyId=${payload.companyId}`,
        method: "GET",
      }),
    }),
    createNewTask: build.mutation<
      any,
      { userId: number; newTaskFromPost: object }
    >({
      query: (data) => ({
        url: `/PostNewTask/`,
        method: "POST",
        body: data,
      }),
    }),
    publishTask: build.mutation<
      any,
      { userId: number; taskId: number; newTaskFromPost: object }
    >({
      query: (data) => ({
        url: `/PublishTask/`,
        method: "POST",
        body: data,
      }),
    }),
    deleteTask: build.mutation<any, { userId: number; taskId: number }>({
      query: (data) => ({
        url: "/DeleteTask/",
        method: "POST",
        body: data,
      }),
    }),
    lockTask: build.mutation<any, { userId: number; taskId: number }>({
      query: (data) => ({
        url: "/LockTask/",
        method: "POST",
        body: data,
      }),
    }),
    getCalendarData: build.query<CalendarDataT, { userId: number }>({
      query: (args) => ({
        url: `/getCalendar/?userId=${args.userId}`,
      }),
    }),
    resizeWorkTime: build.mutation<
      any,
      {
        userId: number;
        taskId: number;
        machineId: number;
        unixStartTime: number;
        unixEndTime: number;
      }
    >({
      query: (data) => ({
        url: "/EditWorkingTime/",
        method: "POST",
        body: data,
      }),
    }),
    resizeTask: build.mutation<
      any,
      {
        userId: number;
        taskId: number;
        unixStartTime: number;
        unixEndTime: number;
      }
    >({
      query: (data) => ({
        url: "/StretchTaskTime/",
        method: "POST",
        body: data,
      }),
    }),
    moveTask: build.mutation<
      any,
      {
        userId: number;
        toMachineId: number;
        newTimeStamp: number;
        taskId: number;
      }
    >({
      query: (data) => ({
        url: `/MoveTask/`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useResizeTaskMutation,
  useResizeWorkTimeMutation,
  usePublishTaskMutation,
  useMoveTaskMutation,
  useLockTaskMutation,
  useDeleteTaskMutation,
  useGetCalendarDataQuery,
  useGetTasksListQuery,
  useGetPaperParamsMutation,
  useCreateNewTaskMutation,
} = calendarService;
