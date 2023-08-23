import { CommonFailedResponse } from "../../../typings/response.js";

export interface CardBalanceSuccessResponse {
  success: true;
  /** @deprecated */
  status: "success";
  data: number;
}

export type CardBalanceResponse =
  | CardBalanceSuccessResponse
  | CommonFailedResponse;
