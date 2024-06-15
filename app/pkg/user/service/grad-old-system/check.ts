import { GRAD_OLD_SYSTEM_HTTPS_SERVER } from "./utils.js";
import type { CookieVerifyResponse } from "../../../../../typings/index.js";
import { request } from "../../../../api/index.js";

export const checkGradSystemCookiesLocal =
  async (): Promise<CookieVerifyResponse> => {
    try {
      const response = await request<string>(
        `${GRAD_OLD_SYSTEM_HTTPS_SERVER}/framework/userInfo_edit.jsp?winid=win6`,
        { redirect: "manual" },
      );

      if (response.status === 200) {
        const text = response.data;

        if (
          text.includes(
            "您登录后过长时间没有操作或您的用户名已经在别处登录！",
          ) ||
          text.startsWith("<script")
        )
          return {
            success: true,
            valid: false,
          };

        return {
          success: true,
          valid: true,
        };
      }

      return {
        success: true,
        valid: false,
      };
    } catch (err) {
      const { message } = err as Error;

      console.error(err);

      return {
        success: false,
        msg: message,
      };
    }
  };

export const checkGradSystemCookiesOnline = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/grad-old-system/check", {
    method: "POST",
    cookieScope: GRAD_OLD_SYSTEM_HTTPS_SERVER,
  }).then(({ data }) => data);
