import { URLSearchParams, logger } from "@mptool/all";

import { queryMyActions } from "./actions.js";
import { getProcess } from "./process.js";
import { MY_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { LoginFailType } from "../loginFailTypes.js";
import { isWebVPNPage } from "../utils.js";

// Note: This can be inferred from app list
const APPLY_MAIL_APP_ID = "GRYXSQ";

interface MailInitSuccessInfo {
  success: true;
  email: string;
  password: string;
}

type MailInitInfo = MailInitSuccessInfo | CommonFailedResponse;

const getMailInitInfo = async (instanceId: string): Promise<MailInitInfo> => {
  const { data } = await request<{
    result: "0";
    MESSAGE: string;
    MAILNAME: string;
    PASSWORD: string;
  }>(`${MY_SERVER}/Gryxsq/getResult`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    body: new URLSearchParams({
      PROC: instanceId,
    }),
  });

  const { MESSAGE, MAILNAME, PASSWORD } = data;

  if (MESSAGE === "邮箱创建成功")
    return {
      success: true,
      email: `${MAILNAME}@nenu.edu.cn`,
      password: PASSWORD,
    };

  return {
    success: false,
    msg: "邮箱创建失败，请联系信息化办",
  };
};

type RawCheckMailData = { flag: false; yxmc: string } | { flag: true };

interface RawAccountList {
  success: boolean;
  data: { text: string; value: string }[];
}

export interface GetEmailNameResponse {
  success: true;
  hasEmail: true;
  email: string;
}

export interface GetEmailInfoResponse {
  success: true;
  hasEmail: false;
  accounts: string[];
  taskId: string;
  instanceId: string;
}

export type GetEmailSuccessResponse =
  | GetEmailNameResponse
  | GetEmailInfoResponse;

export type GetEmailFailedResponse = CommonFailedResponse;

export type GetEmailResponse = GetEmailSuccessResponse | GetEmailFailedResponse;

export const getEmailInfo = async (): Promise<GetEmailResponse> => {
  const { globalData } = getApp<AppOption>();

  const { data: checkResult } = await request<RawCheckMailData>(
    `${MY_SERVER}/Gryxsq/checkMailBox`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({ userId: globalData.account!.id.toString() }),
    },
  );

  if (typeof checkResult !== "object")
    return {
      success: false,
      msg: "获取邮箱信息失败",
    };

  if (!checkResult.flag) {
    const results = await queryMyActions(APPLY_MAIL_APP_ID);

    if (!results[0]?.PROC_INST_ID_)
      return {
        success: false,
        msg: "邮箱已创建，但未找到到申请记录",
      };

    const mailInitInfo = await getMailInitInfo(results[0].PROC_INST_ID_);

    if (mailInitInfo.success === false) return mailInitInfo;

    return {
      ...mailInitInfo,
      hasEmail: true,
    };
  }

  const processResult = await getProcess(APPLY_MAIL_APP_ID);

  if (processResult.success === false) return processResult;

  const { taskId, instanceId } = processResult;

  const { data: accountListResult } = await request<RawAccountList>(
    `${MY_SERVER}/sysform/getSelectOption?random=${Math.random()}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        beanId: "GryxsqService",
        method: "getAccountList",
        paramStr: "{}",
      }),
    },
  );

  if (typeof accountListResult === "object" && accountListResult.success)
    return {
      success: true,
      hasEmail: false,
      accounts: accountListResult.data
        .map(({ value }) => value)
        .filter((item) => Boolean(item)),
      taskId,
      instanceId,
    };

  return {
    success: false,
    msg: "获取可用邮箱失败",
  };
};

export interface ActivateEmailOptions {
  type: "set";
  name: string;
  phone: number | string;
  suffix?: number | string;
  taskId: string;
  instanceId: string;
}

export type ActivateMailSuccessResponse = MailInitSuccessInfo;

export type ActivateMailFailedResponse = CommonFailedResponse & {
  type?: LoginFailType.Expired;
};

export type ActivateEmailResponse =
  | ActivateMailSuccessResponse
  | ActivateMailFailedResponse;

export const activateEmail = async ({
  name,
  phone,
  suffix,
  taskId,
  instanceId,
}: ActivateEmailOptions): Promise<ActivateEmailResponse> => {
  const userInfo = getApp<AppOption>().globalData.userInfo!;

  const { data: checkResult, status } = await request<
    | {
        suc: boolean;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_code: string;
      }
    | string
  >(`${MY_SERVER}/Gryxsq/checkMailBoxAccount`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    body: new URLSearchParams({ mailBoxName: name }),
    redirect: "manual",
  });

  if (
    status === 302 ||
    (typeof checkResult === "string" && isWebVPNPage(checkResult))
  )
    return {
      success: false,
      msg: "请重新登录",
      type: LoginFailType.Expired,
    };

  if (typeof checkResult !== "object")
    return {
      success: false,
      msg: "获取邮箱注册情况失败",
    };

  if (checkResult.suc || !checkResult.error_code.startsWith("ACCOUNT.NOTEXIST"))
    return {
      success: false,
      msg: "邮箱账户已存在",
    };

  const { data: setMailResult } = await request<{ success: boolean }>(
    `${MY_SERVER}/dynamicDrawForm/submitAndSend`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        // can be get through the process
        f: "72f6e76cde1b4af890adf5f417ee153f",
        b: "null",
        TASK_ID_: taskId,
        PROC_INST_ID_: instanceId,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        id__: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        creator__: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pid__: "",
        RYLB: userInfo.code,
        SFSYZDYMC: "1",
        YXZDYMC: "",
        KEYWORDS_: "邮箱",
        SQRXM: userInfo.name,
        SQRXH: userInfo.id.toString(),
        SQRDW: userInfo.org,
        SFZH: userInfo.idCard,
        DHHM: phone.toString(),
        YXMC: name ?? "",
        SFSYSZ: suffix ? "2" : "1",
        YXHZ: suffix?.toString() ?? "",
      }),
    },
  );

  if (typeof setMailResult === "object" && setMailResult.success) {
    const initInfo = await getMailInitInfo(instanceId);

    return initInfo;
  }

  return {
    success: false,
    msg: "申请失败",
  };
};

export const onlineMyEmail = async <T>(
  options?: T,
): Promise<
  T extends ActivateEmailOptions ? ActivateEmailResponse : GetEmailInfoResponse
> =>
  request<
    T extends ActivateEmailOptions
      ? ActivateEmailResponse
      : GetEmailInfoResponse
  >("/my/email", {
    method: "POST",
    ...(options ? { body: options } : {}),
    cookieScope: MY_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("邮箱接口出错", data);

    return data;
  });
