import { env, logger } from "@mptool/all";

import { request } from "../../api/index.js";
import { appId, user } from "../../state/index.js";
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

export const mpLogin = async (): Promise<LoginInfo> => {
  if (user.openid) {
    const { data } = await request<MPLoginResponse>("/mp/login", {
      method: "POST",
      body: { appId, openid: user.openid },
    });

    if (!data.success) {
      logger.error("小程序登录失败", data.msg);

      return DEFAULT_INFO;
    }

    return data.data;
  }

  if (env === "wx") {
    return new Promise<LoginInfo>((resolve) => {
      wx.login({
        success: ({ code }) => {
          resolve(
            request<MPLoginResponse>("/mp/login", {
              method: "POST",
              body: { appId, code, env },
            }).then(({ data }) => {
              if (!data.success) {
                logger.error("小程序登录失败", data.msg);

                return DEFAULT_INFO;
              }

              return data.data;
            }),
          );
        },
        fail: ({ errMsg }) => {
          logger.error("小程序登录失败", errMsg);

          resolve(DEFAULT_INFO);
        },
      });
    });
  }

  // if (env === "donut") {
  //   return new Promise<LoginInfo>((resolve) => {
  //     wx.miniapp.login({
  //       success: ({ code }) => {
  //         resolve(
  //           request<MPLoginResponse>("/mp/login", {
  //             method: "POST",
  //             body: { appId, code, env },
  //           }).then(({ data }) => {
  //             if (!data.success) {
  //               logger.error("App 登录失败", data.msg);

  //               return DEFAULT_INFO;
  //             }

  //             return data.data;
  //           }),
  //         );
  //       },
  //     });
  //   });
  // }

  return Promise.resolve(DEFAULT_INFO);
};
