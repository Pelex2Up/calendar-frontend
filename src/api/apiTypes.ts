export interface ILoginResponse {
  accessToken: string;
  companyId: number;
  optionalAlertMessage: string;
  refreshToken: string;
  role: number;
  userId: number;
}

export interface IListTask {
  publishedDateTimeInfo: string;
  optionalComment: string;
  description: string;
  endingSlotIndex: number;
  hexColor: string;
  id: number;
  isCompleted: boolean;
  isLocked: boolean;
  isProcessing: boolean;
  isWaiting: boolean;
  machineId: number;
  name: string;
  parentId: number;
  startingSlotIndex: number;
  timeSlotsNeeded: number;
  hours: number;
  minutes: number;
  isoStartTime: string;
  isoEndTime: string;
}

export interface IPaperParams {
  allDensityListForEachPaperType: any[];
  allFormatSizesAndValuesList: any[];
  allMachinesWithIds: { Key: string; Value: number }[];
  allPaperTypesAndValuesList: { Key: string; Value: string }[];
}

// export interface IPaperParamsDensityItem {}

export type CalendarDataT = {
  listOfMachinesWithData: {
    machineId: number;
    machineName: string;
    listOfOrders: {
      isoEndTime: number;
      isoStartTime: number;
      description: string;
      endTime: number;
      hexColor: string;
      id: number;
      isCompleted: boolean;
      isLocked: boolean;
      isProcessing: boolean;
      isWaiting: boolean;
      machineId: number;
      name: string;
      optionalComment: string;
      parentId: number;
      startTime: number;
      isTimeTask: boolean;
      canMove: boolean;
      canStretch: boolean;
      canDelete: boolean;
    }[];
  }[];
};
