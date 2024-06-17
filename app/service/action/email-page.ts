import { URLSearchParams, logger } from "@mptool/all";

import { actionState } from "./login.js";
import { ACTION_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../utils/index.js";
import {
  ActionFailType,
  ExpiredResponse,
  UnknownResponse,
  createService,
  handleFailResponse,
  isWebVPNPage,
  supportRedirect,
} from "../utils/index.js";

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

export type ActionEmailPageResponse =
  | CommonSuccessResponse<string>
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Unknown>;

const getEmailPageLocal = async (
  mid = "",
): Promise<ActionEmailPageResponse> => {
  try {
    const { data, status } = await request<RawEmailPageResponse>(
      mid ? EMAIL_PAGE_URL : EMAIL_URL,
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: new URLSearchParams({
          ...(mid ? { domain: "nenu.edu.cn", mid } : {}),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_name: "",
        }),
        redirect: "manual",
      },
    );

    if (
      status === 302 ||
      // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
      // In this case, the response.status will be 200 and the response body will be the WebVPN login page
      (!supportRedirect && isWebVPNPage(data))
    ) {
      actionState.method = "login";

      return ExpiredResponse;
    }

    if (!data.success) throw new Error("获取邮件页面失败");

    actionState.method = "check";

    return {
      success: true,
      data: data.url,
    };
  } catch (err) {
    const { message } = err as Error;

    console.error(err);
    actionState.method = "login";

    return UnknownResponse(message);
  }
};

const getEmailPageOnline = async (mid = ""): Promise<ActionEmailPageResponse> =>
  request<ActionEmailPageResponse>("/action/email-page", {
    method: "POST",
    body: { mid },
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => {
    if (!data.success) {
      logger.error("获取最近邮件失败", data);

      if (data.type === ActionFailType.Expired) actionState.method = "login";
      handleFailResponse(data);
    }

    return data;
  });

export const getEmailPage = createService(
  "email-page",
  getEmailPageLocal,
  getEmailPageOnline,
);
