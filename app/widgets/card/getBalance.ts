import { URLSearchParams, logger } from "@mptool/all";

import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
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

    const { data } = await request<RawCardBalanceData>(url, {
      method: "POST",
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: new URLSearchParams({
        serviceAddress: "wis-apis/soap/00001_00083_01_02_20181210185800",
        serviceSource: "ds2",
        params: JSON.stringify({ xgh: null }),
      }),
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
  const data = await request<CardBalanceResponse>("/action/card-balance", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data);

  if (!data.success) logger.error("获取校园卡余额出错", data);

  return data;
};
