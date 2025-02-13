import { HTMLProps } from "react";
import {
  ReactCalendarTimelineProps,
  TimelineGroupBase,
  TimelineItemBase,
} from "react-calendar-timeline";

export type CalendarGroupT = TimelineGroupBase & {
  id: string | number;
  label: string;
  bgColor: string;
};

export type CalendarDataItemT = TimelineItemBase<number> & {
  id: number;
  group: string | number;
  title: string;
  start_time: number;
  end_time: number;
  canMove?: boolean;
  breakTime: boolean;
  canDelete: boolean;
  description?: string;
  canResize?: true | false | "left" | "right" | "both";
  className?: string;
  bgColor?: string;
  selectedBgColor?: string;
  color?: string;
  itemProps?: HTMLProps<HTMLDivElement>;
};

export type TimelineProps = ReactCalendarTimelineProps<
  CalendarDataItemT,
  CalendarGroupT
>;

export type UserT = {
  authState: {
    access: string;
    refresh: string;
  };
  orgId: number;
  userId: number;
  auth: boolean;
  role: number;
};
