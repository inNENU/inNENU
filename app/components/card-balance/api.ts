import { logger } from "@mptool/all";

import { type CardBalanceResponse } from "./typings.js";
import { ACTION_SERVER, request } from "../../api/index.js";
import { service } from "../../config/index.js";

export const getCardBalance = async (): Promise<CardBalanceResponse> => {
  const data = await request<CardBalanceResponse>(
    `${service}action/card-balance`,
    {
      method: "POST",
      scope: ACTION_SERVER,
    },
  );

  if (!data.success) logger.error("获取校园卡余额出错", data);

  return data;
};
