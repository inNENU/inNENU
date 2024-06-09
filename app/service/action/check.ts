import { ACTION_SERVER } from "./utils.js";
import type { CookieVerifyResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

export const checkActionCookiesLocal =
  async (): Promise<CookieVerifyResponse> => {
    const response = await request(`${ACTION_SERVER}/page/getidentity`, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      redirect: "manual",
    });

    if (response.status === 200)
      try {
        const result = response.data as { success: boolean };

        return {
          success: true,
          valid: result.success,
        };
      } catch (err) {
        return {
          success: true,
          valid: false,
        };
      }

    return {
      success: true,
      valid: false,
    };
  };

export const checkActionCookiesOnline = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/action/check", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data);
