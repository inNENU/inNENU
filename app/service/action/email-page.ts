import { URLSearchParams, logger } from "@mptool/all";

import { ACTION_MAIN_PAGE, ACTION_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

const EMAIL_PAGE_URL = `${ACTION_SERVER}/extract/sendRedirect2Email`;
const EMAIL_URL = `${ACTION_SERVER}/extract/sendRedirect2EmailPage`;

export interface ActionEmailPageOptions {
  /** 邮件 ID */
  mid?: string;
}

interface RawEmailPageResponse {
  success: boolean;
  url: string;
}

export interface ActionEmailPageSuccessResponse {
  success: true;
  url: string;
}

export type ActionEmailPageResponse =
  | ActionEmailPageSuccessResponse
  | CommonFailedResponse;

export const emailPage = async (mid = ""): Promise<ActionEmailPageResponse> => {
  const { data: emailPageResult } = await request<RawEmailPageResponse>(
    mid ? EMAIL_PAGE_URL : EMAIL_URL,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        Referer: ACTION_MAIN_PAGE,
      },
      body: new URLSearchParams({
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
  request<ActionEmailPageResponse>("/action/email-page", {
    method: "POST",
    body: { mid },
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取最近邮件失败", data);

    return data;
  });
