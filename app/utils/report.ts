import { request } from "../api/index.js";
import type { AppOption } from "../app.js";

const { globalData } = getApp<AppOption>();

export const reportInfo = (): Promise<void> =>
  request<never>("/mp/report", {
    method: "POST",
    body: {
      type: "contact",
      info: globalData.userInfo,
      account: globalData.account,
      openid: globalData.openid,
    },
  }).then(({ data }) => data);
