import { logger, query } from "@mptool/all";

import type {
  ActionEmailPageResponse,
  ActionRecentMailResponse,
  ActivateEmailOptions,
  ActivateEmailResponse,
  GetEmailInfoResponse,
  GetEmailResponse,
  RawAccountList,
  RawCheckMailData,
  RawEmailPageResponse,
  RawRecentMailResponse,
} from "./typings.js";
import { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { service } from "../../config/info.js";
import { ACTION_MAIN_PAGE, ACTION_SERVER } from "../../login/action.js";
import { MY_SERVER, getProcess } from "../../login/my.js";
import { UserInfo } from "../../utils/typings.js";

const { globalData } = getApp<AppOption>();

// Note: This can be inferred from app list
const APPLY_MAIL_APP_ID = "GRYXSQ";

const PASSWORD_CHARS = [
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "abcdefghijklmnopqrstuvwxyz",
  "1234567890",
];

const initRandomPassWord = (length: number): string => {
  const password: string[] = [];
  let n = 0;

  for (let i = 0; i < length; i++)
    if (password.length < length - 3) {
      // Get random passwordArray index
      const arrayRandom = Math.floor(Math.random() * 3);
      // Get password array value
      const passwordItem = PASSWORD_CHARS[arrayRandom];
      // Get password array value random index
      // Get random real value
      const char =
        passwordItem[Math.floor(Math.random() * passwordItem.length)];

      password.push(char);
    } else {
      const passwordItem = PASSWORD_CHARS[n];

      const char =
        passwordItem[Math.floor(Math.random() * passwordItem.length)];
      // Get array splice index
      const spliceIndex = Math.floor(Math.random() * password.length);

      // insert every type randomly
      password.splice(spliceIndex, 0, char);
      n++;
    }

  return password.join("");
};

export const getEmail = async (): Promise<GetEmailResponse> => {
  const checkResult = await request<RawCheckMailData>(
    `${MY_SERVER}/Gryxsq/checkMailBox`,
    {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: `userId=${globalData.account!.id}`,
      scope: MY_SERVER,
    },
  );

  if (typeof checkResult !== "object")
    return {
      success: false,
      msg: "获取邮箱信息失败",
    };

  if (!checkResult.flag)
    return {
      success: true,
      hasEmail: true,
      email: checkResult.yxmc,
    };

  const processResult = await getProcess(APPLY_MAIL_APP_ID);

  if (processResult.success === false) return processResult;

  const { taskId, instanceId } = processResult;

  const accountListResult = await request<RawAccountList>(
    `${MY_SERVER}/sysform/getSelectOption?random=${Math.random()}`,
    {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: "beanId=GryxsqService&method=getAccountList&paramStr=%7B%7D",
      scope: MY_SERVER,
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
  const checkResult = await request<{ suc: boolean }>(
    "https://my.webvpn.nenu.edu.cn/Gryxsq/checkMailBoxAccount",
    {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: `mailBoxName=${name}`,
      scope: MY_SERVER,
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

  const password = initRandomPassWord(10);

  const setMailResult = await request<{ success: boolean }>(
    `${MY_SERVER}/dynamicDrawForm/submitAndSend`,
    {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: query.stringify({
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
        MM: password,
      }),
    },
  );

  if (typeof setMailResult === "object" && setMailResult.success)
    return {
      success: true,
      email: `${name}${suffix ?? ""}@nenu.edu.cn`,
      password: password,
    };

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
  >(`${service}my/email`, {
    method: "POST",
    // @ts-ignore
    ...(options ? { data: query.stringify(options) } : {}),
    scope: MY_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("邮箱接口出错", data);

    return data;
  });

const EMAIL_INFO_URL = `${ACTION_SERVER}/extract/getEmailInfo`;

export const recentEmails = async (): Promise<
  ActionRecentMailResponse | CommonFailedResponse
> => {
  const checkResult = await request<RawRecentMailResponse>(EMAIL_INFO_URL, {
    method: "POST",
    header: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: ACTION_MAIN_PAGE,
    },
    data: `domain=nenu.edu.cn&type=1&format=json`,
    scope: EMAIL_INFO_URL,
  });

  if (
    typeof checkResult === "object" &&
    "success" in checkResult &&
    checkResult.success &&
    checkResult.emailList.con
  )
    return {
      success: true,
      unread: Number(checkResult.count),
      recent: checkResult.emailList.con.var.map(
        ({ subject, receivedDate, from, id }) => ({
          subject,
          receivedDate,
          from,
          mid: id,
        }),
      ),
    };

  return {
    success: false,
    msg: "用户无邮箱",
  };
};

export const onlineRecentEmails = async (): Promise<ActionRecentMailResponse> =>
  request<ActionRecentMailResponse>(`${service}action/recent-email`, {
    method: "POST",
    scope: ACTION_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取最近邮件失败", data);

    return data;
  });

const EMAIL_PAGE_URL = `${ACTION_SERVER}/extract/sendRedirect2Email`;
const EMAIL_URL = `${ACTION_SERVER}/extract/sendRedirect2EmailPage`;

export const emailPage = async (mid = ""): Promise<ActionEmailPageResponse> => {
  const emailPageResult = await request<RawEmailPageResponse>(
    mid ? EMAIL_PAGE_URL : EMAIL_URL,
    {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: ACTION_MAIN_PAGE,
      },
      data: query.stringify({
        ...(mid ? { domain: "nenu.edu.cn", mid } : {}),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_name: "",
      }),
    },
  );

  if (typeof emailPageResult === "object" && emailPageResult.success)
    return {
      success: true,
      url: emailPageResult.url,
    };

  return {
    success: false,
    msg: "获取邮件页面失败",
  };
};

export const onlineEmailPage = async (
  mid = "",
): Promise<ActionEmailPageResponse> =>
  request<ActionEmailPageResponse>(`${service}action/email-page`, {
    method: "POST",
    data: { mid },
    scope: ACTION_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取最近邮件失败", data);

    return data;
  });
