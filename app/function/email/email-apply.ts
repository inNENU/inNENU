import { URLSearchParams, logger } from "@mptool/all";

import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import type {
  AuthLoginFailedResponse,
  VPNLoginFailedResponse,
} from "../../login/index.js";
import { MY_SERVER, getProcess, queryCompleteActions } from "../../login/my.js";
import { UserInfo } from "../../utils/typings.js";

const { globalData } = getApp<AppOption>();

export interface RawAccountList {
  success: boolean;
  data: { text: string; value: string }[];
}

export type RawCheckMailData = { flag: false; yxmc: string } | { flag: true };

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

export type GetEmailResponse =
  | GetEmailNameResponse
  | GetEmailInfoResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | CommonFailedResponse;

export interface ActivateEmailOptions {
  type: "set";
  name: string;
  phone: number | string;
  suffix?: number | string;
  taskId: string;
  instanceId: string;
}

export type ActivateMailFailedResponse =
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | CommonFailedResponse;

export type ActivateEmailResponse =
  | MailInitSuccessInfo
  | ActivateMailFailedResponse;

// Note: This can be inferred from app list
const APPLY_MAIL_APP_ID = "GRYXSQ";

interface MailInitRawData {
  result: "0";
  MESSAGE: string;
  MAILNAME: string;
  PASSWORD: string;
}

interface MailInitSuccessInfo {
  success: true;
  email: string;
  password: string;
}

interface MailInitFailedInfo {
  success: false;
  msg: string;
}

type MailInitInfo = MailInitSuccessInfo | MailInitFailedInfo;

const getMailInitInfo = async (instanceId: string): Promise<MailInitInfo> => {
  const { data: mailInfoResponse } = await request<MailInitRawData>(
    `${MY_SERVER}/Gryxsq/getResult`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        PROC: instanceId,
      }),
    },
  );

  if (typeof mailInfoResponse === "object") {
    const { MESSAGE, MAILNAME, PASSWORD } = mailInfoResponse;

    if (MESSAGE === "邮箱创建成功")
      return {
        success: true,
        email: `${MAILNAME}@nenu.edu.cn`,
        password: PASSWORD,
      };
  }

  return {
    success: false,
    msg: "邮箱创建失败，请联系信息化办",
  };
};

export const getEmail = async (): Promise<GetEmailResponse> => {
  const { data: checkResult } = await request<RawCheckMailData>(
    `${MY_SERVER}/Gryxsq/checkMailBox`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({ userId: globalData.account!.id.toString() }),
      cookieScope: MY_SERVER,
    },
  );

  if (typeof checkResult !== "object")
    return {
      success: false,
      msg: "获取邮箱信息失败",
    };

  if (!checkResult.flag) {
    const actions = await queryCompleteActions();

    if (!actions.success)
      return {
        success: false,
        msg: "邮箱申请记录失败",
      };

    const { serviceId } = actions.data.find(
      (item) => item.flowName === "个人邮箱申请",
    )!;

    const mailInitInfo = await getMailInitInfo(serviceId);

    if (mailInitInfo.success === false) return mailInitInfo;

    return {
      hasEmail: true,
      ...mailInitInfo,
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
      cookieScope: MY_SERVER,
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

export const activateEmail = async (
  { name, phone, suffix, taskId, instanceId }: ActivateEmailOptions,
  userInfo: UserInfo,
): Promise<ActivateEmailResponse> => {
  const { data: checkResult } = await request<{ suc: boolean }>(
    "https://my.webvpn.nenu.edu.cn/Gryxsq/checkMailBoxAccount",
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({ mailBoxName: name }),
      cookieScope: MY_SERVER,
    },
  );

  if (typeof checkResult !== "object")
    return {
      success: false,
      msg: "获取邮箱注册情况失败",
    };

  if (checkResult.suc)
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
