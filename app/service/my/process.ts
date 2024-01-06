import { URLSearchParams } from "@mptool/all";

import { MY_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { LoginFailType } from "../loginFailTypes.js";

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
  | CommonFailedResponse;

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

    if (status === 302)
      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录信息已过期，请重新登录",
      };

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
    console.error(err);

    return {
      success: false,
      msg: `获取流程信息失败: ${(<Error>err).message}`,
    };
  }
};
