import { logger } from "@mptool/all";

import { CommonFailedResponse } from "../../../typings/index.js";
import { cookieStore, request } from "../../api/net.js";
import { LoginFailType } from "../../login/loginFailTypes.js";
import { UNDER_SYSTEM_SERVER } from "../../login/under-system.js";
import { isWebVPNPage } from "../../login/utils.js";

const alertRegExp = /window.alert\('(.+?)'\)/;

export interface RegisterUnderStudentArchiveOptions {
  type?: "register";
  idCard: string;
}

export interface UnderRegisterStudentArchiveSuccessResponse {
  success: true;
}

export type UnderRegisterStudentArchiveResponse =
  | UnderRegisterStudentArchiveSuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export const registerStudentArchive = async (
  path: string,
): Promise<UnderRegisterStudentArchiveResponse> => {
  const url = `${UNDER_SYSTEM_SERVER}${path}`;

  const { data: content } = await request<string>(url);

  if (isWebVPNPage(content)) {
    cookieStore.clear();

    return {
      success: false,
      type: LoginFailType.Expired,
      msg: "登录已过期，请重新登录",
    };
  }

  const alert = alertRegExp.exec(content)?.[1] || "注册失败";

  if (alert === "注册成功。") return { success: true };

  return {
    success: false,
    msg: alert,
  };
};

export const useOnlineRegisterStudentArchive = (
  path: string,
): Promise<UnderRegisterStudentArchiveResponse> =>
  request<UnderRegisterStudentArchiveResponse>(
    "/under-system/student-archive",
    {
      method: "POST",
      body: { type: "register", path },
      cookieScope: UNDER_SYSTEM_SERVER,
    },
  ).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });
