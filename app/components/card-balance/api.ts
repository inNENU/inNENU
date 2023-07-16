import { logger } from "@mptool/all";

import { type CardBalanceResponse } from "./typings.js";
import { ACTION_SERVER, request } from "../../api/index.js";
import { service } from "../../config/info.js";

export const getCardBalance = (): Promise<CardBalanceResponse> =>
  request<CardBalanceResponse>(`${service}action/card-balance`, {
    method: "POST",
    scope: ACTION_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取校园卡余额出错", data);

    return data;
  });
