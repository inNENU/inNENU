import { request } from "../api/index.js";
import type { AppOption } from "../app.js";
import { service } from "../config/index.js";

const { globalData } = getApp<AppOption>();

export const reportInfo = (): Promise<void> =>
  request<never>(`${service}mp/report`, {
    method: "POST",
    data: {
      type: "contact",
      info: globalData.userInfo,
      account: globalData.account,
      openid: globalData.openid,
    },
  });
