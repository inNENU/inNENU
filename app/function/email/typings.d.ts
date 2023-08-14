import type { CommonFailedResponse } from "../../../typings/response.js";
import type {
  AuthLoginFailedResponse,
  VPNLoginFailedResponse,
} from "../../login/typings.js";

export type RawCheckMailData = { flag: false; yxmc: string } | { flag: true };

export interface RawAccountList {
  success: boolean;
  data: { text: string; value: string }[];
}

export interface GetEmailNameResponse {
  success: true;
  hasEmail: true;
  email: string;
}

export interface GetEmailInfoResponse {
  success: true;
  hasEmail: false;
  accounts: string[];
  taskId: string;
  instanceId: string;
}

export type GetEmailResponse =
  | GetEmailNameResponse
  | GetEmailInfoResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | CommonFailedResponse;

export interface ActivateEmailOptions {
  type: "set";
  name: string;
  emailPassword?: string;
  phone: number | string;
  suffix?: number | string;
  taskId: string;
  instanceId: string;
}

export interface ActivateEmailSuccessResponse {
  success: true;
  email: string;
  password: string;
}

export type ActivateMailFailedResponse =
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse
  | CommonFailedResponse;

export type ActivateEmailResponse =
  | ActivateEmailSuccessResponse
  | ActivateMailFailedResponse;
