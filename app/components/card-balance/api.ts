import { logger } from "@mptool/all";

import { type CardBalanceResponse } from "./typings.js";
import { ACTION_SERVER } from "../../api/login/action.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const getCardBalance = (): Promise<CardBalanceResponse> =>
  request<CardBalanceResponse>(`${service}action/card-balance`, {
    method: "POST",
    scope: ACTION_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取校园卡余额出错", data);

    return data;
  });
