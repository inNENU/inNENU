import { URLSearchParams, logger } from "@mptool/all";

import { MY_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import type { ActionFailType, CommonFailedResponse } from "../utils/index.js";
import { ExpiredResponse } from "../utils/index.js";

interface RawProcessResult {
  success: boolean;
  needShow: boolean;
  TASK_ID_: string;
  processDefinitionId: string;
  processDefinitionKey: string;
  PROC_INST_ID_: string;
  realFormPath: string;
  formPath: string;
}

export interface MyProcessSuccessResult {
  success: true;
  taskId: string;
  processId: string;
  processKey: string;
  instanceId: string;
  formPath: string;
  realFormPath: string;
}

export type MyProcessResult =
  | MyProcessSuccessResult
  | AuthLoginFailedResponse
  | CommonFailedResponse<ActionFailType.Expired>;

export const getProcess = async (
  processId: string,
): Promise<MyProcessResult> => {
  try {
    const processURL = `${MY_SERVER}/wf/process/startProcessByKey/${processId}?random=${Math.random()}`;

    const { data, status } = await request<RawProcessResult>(processURL, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({ isFormPathDetail: "false" }),
      redirect: "manual",
    });

    if (status === 302) return ExpiredResponse;

    if (typeof data === "object")
      return {
        success: true,
        taskId: data.TASK_ID_,
        instanceId: data.PROC_INST_ID_,
        formPath: data.formPath,
        realFormPath: data.realFormPath,
        processId: data.processDefinitionId,
        processKey: data.processDefinitionKey,
      };

    return {
      success: false,
      msg: "获取流程信息失败",
    };
  } catch (err) {
    logger.error(err);

    return {
      success: false,
      msg: `获取流程信息失败: ${(err as Error).message}`,
    };
  }
};
