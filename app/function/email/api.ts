import { logger, query } from "@mptool/all";

import type {
  ActivateEmailOptions,
  ActivateEmailResponse,
  GetEmailInfoResponse,
  GetEmailResponse,
  RawAccountList,
  RawCheckMailData,
} from "./typings.js";
import { request } from "../../api/net.js";
import type { AppOption } from "../../app.js";
import { service } from "../../config/info.js";
import { MY_SERVER, getProcess } from "../../login/my.js";

const { globalData } = getApp<AppOption>();

// Note: This can be inferred from app list
const APPLY_MAIL_APP_ID = "GRYXSQ";

export const getEmailInfo = async (): Promise<GetEmailResponse> => {
  const info = globalData.userInfo!;

  const checkResult = await request<RawCheckMailData>(
    `${MY_SERVER}/Gryxsq/checkMailBox`,
    {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: `userId=${info.id}`,
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

export const activateEmail = async ({
  name,
  emailPassword,
  phone,
  suffix,
  taskId,
  instanceId,
}: ActivateEmailOptions): Promise<ActivateEmailResponse> => {
  const info = globalData.userInfo!;
  const password = emailPassword || "inNENU4ever";
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
        RYLB: info.code,
        SFSYZDYMC: "1",
        YXZDYMC: "",
        KEYWORDS_: "邮箱",
        SQRXM: info.name,
        SQRXH: info.id.toString(),
        SQRDW: info.org,
        SFZH: info.idCard,
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
      password,
    };

  return {
    success: false,
    msg: "申请失败",
  };
};

export const onlineEmail = async <T>(
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
