import { MY_SERVER } from "./utils.js";
import type { CookieVerifyResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

export const checkMyCookie = async (): Promise<CookieVerifyResponse> => {
  const { data: identityResult } = await request<{ success: boolean } | string>(
    `${MY_SERVER}/hallIndex/getidentity`,
    {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
  );

  return {
    success: true,
    valid: typeof identityResult === "object" && identityResult.success,
  };
};

export const checkOnlineMyCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/my/check", {
    method: "POST",
    cookieScope: MY_SERVER,
  }).then(({ data }) => data);
