import { logger } from "@mptool/all";

import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import { ACTION_SERVER, AuthLoginFailedResponse } from "../../login/index.js";

type RawCardBalanceData =
  | {
      success: true;
      demo: {
        items: {
          item: [{ kye: string }];
        };
      };
    }
  | {
      success: false;
    };

export interface CardBalanceSuccessResponse {
  success: true;
  /** @deprecated */
  status: "success";
  data: number;
}

export type CardBalanceResponse =
  | CardBalanceSuccessResponse
  | CommonFailedResponse;

export const getCardBalance = async (): Promise<CardBalanceResponse> => {
  try {
    const url = `${ACTION_SERVER}/soapBasic/postSoap`;

    const data = await request<RawCardBalanceData>(url, {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: "serviceAddress=wis-apis%2Fsoap%2F00001_00083_01_02_20181210185800&serviceSource=ds2&params=%7B%22xgh%22%3Anull%7D",
    });

    if (data.success)
      return <CardBalanceSuccessResponse>{
        success: true,
        data: Number(data.demo.items.item[0].kye) / 100,
      };

    return <AuthLoginFailedResponse>{
      success: false,
      msg: JSON.stringify(data),
    };
  } catch (err) {
    const { message } = <Error>err;

    console.error(err);

    return <AuthLoginFailedResponse>{
      success: false,
      msg: message,
    };
  }
};

export const getOnlineCardBalance = async (): Promise<CardBalanceResponse> => {
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
