import { URLSearchParams } from "@mptool/all";

import { MY_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import { isWebVPNPage } from "../utils.js";

const GET_APPLY_DATA_URL = `${MY_SERVER}/AnalysisForPerson/loadMyApplyData`;

const BUILD_IN_COLUMNS = [
  "TASK_NAME_",
  "CREATE_TIME_",
  "END_TIME_",
  "END_ACT_ID_",
  "DELETE_REASON_",
  "PROC_DEF_ID_",
  "PROC_INST_ID_",
  "TASK_ID_",
  "ASSIGNEE_",
  "BIZID__",
  "CREATOR__",
  "PID__",
];
const FIELD_INFO_REGEXP = /var fieldinfo = \[([^\]]+)\];\s/;
const FIELD_REG_EXP =
  /{"LABEL":".*?","ORDER_TYPE":.*?,"ORDER_PRIORITY":.*?,"DATA_TYPE":.*?,"COLUMN_NAME":"(.*?)","QUERY_TYPE":null}/g;
const USER_ID_REG_EXP = /"LOGINNAME":"(\d+)",/;
const FORM_ID_REG_EXP = /"FORM_ID":"(.*?)",/;

export type MyActionItem<T extends Record<string, unknown>> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ID__: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  PID__: null;
  END_ACT_ID_: string;
  TASK_NAME_: string;
  CREATE_TIME_: string;
  ASSIGNEE_: null;
  PROC_INST_ID_: string;
  DELETE_REASON_: null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  CREATOR__: string;
  TASK_ID_: null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BIZID__: string;
  PROC_DEF_ID_: string;
  RN: number;
  END_TIME_: string;
} & T;

export interface RawMyActionData<T extends Record<string, unknown>> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
  data: MyActionItem<T>[];
}

export const queryMyActions = async <T extends Record<string, unknown>>(
  key: string,
): Promise<MyActionItem<T>[]> => {
  const actionPageUrl = `${MY_SERVER}/AnalysisForPerson/viewExportPage?loadType=myApply&type=3&key=${key}`;
  const { data: actionPageContent, status } =
    await request<string>(actionPageUrl);

  if (status === 302 || isWebVPNPage(actionPageContent))
    throw new Error("请重新登录");

  const fieldsInfo = FIELD_INFO_REGEXP.exec(actionPageContent)![1];

  const fields = Array.from(fieldsInfo.matchAll(FIELD_REG_EXP)).map(
    ([, field]) => field,
  );

  const colNames = [
    ...fields,
    ...(fields.every((field) => field.toUpperCase() !== "ID__")
      ? ["ID__"]
      : []),
    ...BUILD_IN_COLUMNS,
  ].join(",");
  const userId = USER_ID_REG_EXP.exec(actionPageContent)![1];
  const formId = FORM_ID_REG_EXP.exec(actionPageContent)![1];

  const { data: queryResult } = await request<RawMyActionData<T>>(
    GET_APPLY_DATA_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        tbName: key,
        colNames,
        userId,
        formId,
        tabId: "myApplyed",
        orderCol: "[]",
        type: "3",
        startTime: "",
        endTime: "",
        loadType: "myApply",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        wf_unusual: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        avg_time: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        end_status: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        proc_key: key,
        _search: "false",
        nd: new Date().getTime().toString(),
        limit: "100",
        page: "1",
        sidx: "CREATE_TIME_",
        sord: "desc",
      }),
    },
  );

  return queryResult.data;
};
