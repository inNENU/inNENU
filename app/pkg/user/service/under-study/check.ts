import { UNDER_STUDY_SERVER } from "./utils.js";
import type { CookieVerifyResponse } from "../../../../../typings/index.js";
import { request } from "../../../../api/index.js";

export const checkUnderStudyCookiesLocal =
  async (): Promise<CookieVerifyResponse> => {
    try {
      const response = await request<string>(UNDER_STUDY_SERVER, {
        redirect: "manual",
      });

      if (response.status === 302) {
        const location = response.headers.get("location");

        if (location === `${UNDER_STUDY_SERVER}/new/welcome.page`)
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

export const checkUnderStudyCookiesOnline = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>("/under-study/check", {
    method: "POST",
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);
