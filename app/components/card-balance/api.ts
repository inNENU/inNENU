import {
  type CardBalanceOptions,
  type CardBalanceResponse,
} from "./typings.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const getCardBalance = (
  options: CardBalanceOptions,
): Promise<CardBalanceResponse> =>
  request<CardBalanceResponse>(`${service}action/card-balance`, {
    method: "POST",
    data: options,
  });
