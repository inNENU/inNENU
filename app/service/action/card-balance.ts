import { logger } from "@mptool/all";

import { actionState } from "./login.js";
import { ACTION_SERVER } from "./utils.js";
import { request } from "../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../utils/index.js";
import {
  ActionFailType,
  ExpiredResponse,
  UnknownResponse,
  createService,
  handleFailResponse,
  isWebVPNPage,
  supportRedirect,
} from "../utils/index.js";

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

export type CardBalanceResponse =
  | CommonSuccessResponse<number>
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Unknown>;

const getCardBalanceLocal = async (): Promise<CardBalanceResponse> => {
  try {
    const { data, status } = await request<RawCardBalanceData>(
      CARD_BALANCE_URL,
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: CARD_BALANCE_PARAMS,
        redirect: "manual",
      },
    );

    if (
      status === 302 ||
      // Note: If the env does not support "redirect: manual", the response will be a 302 redirect to WebVPN login page
      // In this case, the response.status will be 200 and the response body will be the WebVPN login page
      (!supportRedirect && isWebVPNPage(data))
    ) {
      actionState.method = "login";

      return ExpiredResponse;
    }

    if (data.success) {
      const balanceList = data.demo.items.item;

      actionState.method = "check";

      return {
        success: true,
        data: balanceList[0]?.kye.match(/\d+/)
          ? Number(balanceList[0].kye) / 100
          : 0,
      };
    }

    throw JSON.stringify(data);
  } catch (err) {
    const { message } = err as Error;

    console.error(err);
    actionState.method = "login";

    return UnknownResponse(message);
  }
};

const getCardBalanceOnline = async (): Promise<CardBalanceResponse> => {
  const data = await request<CardBalanceResponse>("/action/card-balance", {
    method: "POST",
    cookieScope: ACTION_SERVER,
  }).then(({ data }) => data);

  if (!data.success) {
    logger.error("获取校园卡余额出错", data);

    if (data.type === ActionFailType.Expired) actionState.method = "login";
    handleFailResponse(data);
  }

  return data;
};

export const getCardBalance = createService(
  "card-balance",
  getCardBalanceLocal,
  getCardBalanceOnline,
);
