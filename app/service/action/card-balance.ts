import { logger } from "@mptool/all";

import { ACTION_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { AuthLoginFailedResponse } from "../auth/index.js";
import { LoginFailType } from "../loginFailTypes.js";

const CARD_BALANCE_URL = `${ACTION_SERVER}/soapBasic/postSoap`;
const CARD_BALANCE_PARAMS =
  "serviceAddress=wis-apis%2Fsoap%2F00001_00083_01_02_20181210185800&serviceSource=ds2&params=%7B%22xgh%22%3Anull%7D";

type RawCardBalanceData =
  | {
      success: true;
      demo: {
        items: {
          item: [{ kye: string }];
        };
      };
    }
  | { success: false };

export interface CardBalanceSuccessResponse {
  success: true;
  data: number;
}

export type CardBalanceResponse =
  | CardBalanceSuccessResponse
  | AuthLoginFailedResponse
  | CommonFailedResponse;

export const getCardBalance = async (): Promise<CardBalanceResponse> => {
  try {
    const { data, status } = await request<RawCardBalanceData>(
      CARD_BALANCE_URL,
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: `${ACTION_SERVER}/basicInfo/studentPageTurn?type=lifeschool`,
        },
        body: CARD_BALANCE_PARAMS,
        redirect: "manual",
      },
    );

    if (status === 302)
      return <AuthLoginFailedResponse>{
        success: false,
        type: LoginFailType.Expired,
        msg: "登录信息已过期，请重新登录",
      };

    if (data.success) {
      const balanceList = data.demo.items.item;

      return <CardBalanceSuccessResponse>{
        success: true,
        data: balanceList[0]?.kye.match(/\d+/)
          ? Number(balanceList[0].kye) / 100
          : 0,
      };
    }

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
