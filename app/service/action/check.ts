import { ACTION_SERVER } from "./utils.js";
import type { CookieVerifyResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

export const checkActionCookie = async (): Promise<CookieVerifyResponse> => {
  const response = await request(`${ACTION_SERVER}/page/getidentity`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    redirect: "manual",
  });

  if (response.status === 200)
    try {
      const result = <{ success: boolean }>response.data;

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

export const checkOnlineActionCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/action/check", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data);
