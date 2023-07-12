import { CookieOptions } from "../../../typings/cookie.js";
import { CommonFailedResponse } from "../../../typings/response.js";
import { AccountBasicInfo } from "../../utils/app.ts";

export type CardBalanceOptions = AccountBasicInfo | CookieOptions;

export interface CardBalanceSuccessResponse {
  success: true;
  /** @deprecated */
  status: "success";
  data: number;
}

export type CardBalanceResponse =
  | CardBalanceSuccessResponse
  | CommonFailedResponse;
