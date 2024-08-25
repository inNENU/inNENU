import { logger } from "@mptool/all";

import { request } from "../../api/index.js";
import { appID, env, user } from "../../state/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../utils/index.js";

export interface LoginInfo {
  openid: string | null;
  isAdmin: boolean;
  inBlacklist: boolean;
}

export type MPLoginSuccessResponse = CommonSuccessResponse<{
  openid: string;
  inBlacklist: boolean;
  isAdmin: boolean;
}>;

export type MPloginFailResponse = CommonFailedResponse<
  | ActionFailType.MissingArg
  | ActionFailType.DatabaseError
  | ActionFailType.Unknown
>;

export type MPLoginResponse = MPLoginSuccessResponse | MPloginFailResponse;

const DEFAULT_INFO: LoginInfo = {
  openid: null,
  isAdmin: false,
  inBlacklist: false,
};

export const mpLogin = (): Promise<LoginInfo> => {
  if (user.openid)
    return request<MPLoginResponse>("/mp/login", {
      method: "POST",
      body: { openid: user.openid },
    }).then(({ data }) => (data.success ? data.data : DEFAULT_INFO));

  if (env === "qq" || env === "wx") {
    return new Promise<LoginInfo>((resolve) => {
      wx.login({
        success: ({ code }) => {
          resolve(
            request<MPLoginResponse>("/mp/login", {
              method: "POST",
              body: { appID, code, env },
            }).then(({ data }) => {
              if (!data.success) {
                logger.error(`Login failed: ${data.msg}`);

                return DEFAULT_INFO;
              }

              return data.data;
            }),
          );
        },
        fail: ({ errMsg }) => {
          logger.error(`Login failed: ${errMsg}`);

          resolve(DEFAULT_INFO);
        },
      });
    });
  }

  return Promise.resolve(DEFAULT_INFO);
};
