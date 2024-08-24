import { withUnderStudyLogin } from "./login.js";
import { UNDER_STUDY_SERVER } from "./utils.js";
import { request } from "../../../../api/index.js";
import type {
  AuthLoginFailedResponse,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";

export interface TableClassData {
  name: string;
  teachers: string[];
  time: string;
  weeks: number[];
  locations: string[];
  classIndex: [number, number];
}

export type TableCellData = TableClassData[];
export type TableRowData = TableCellData[];
export type TableData = TableRowData[];

export type UnderCourseTableSuccessResponse = CommonSuccessResponse<{
  table: TableData;
  startTime: string;
}>;

export type UnderCourseTableResponse =
  | UnderCourseTableSuccessResponse
  | AuthLoginFailedResponse
  | CommonFailedResponse;

export const getUnderCourseTableOnline = (
  time: string,
): Promise<UnderCourseTableResponse> =>
  request<UnderCourseTableResponse>("/under-study/course-table", {
    method: "POST",
    body: { time },
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const getUnderCourseTable = withUnderStudyLogin(
  getUnderCourseTableOnline,
);
