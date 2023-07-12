import {
  MainInfoListOptions,
  MainInfoListResponse,
  MainInfoResponse,
} from "./typings.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const getInfo = (url: string): Promise<MainInfoResponse> =>
  request<MainInfoResponse>(`${service}main/info?url=${url}`);

export const getInfoList = (
  options: MainInfoListOptions,
): Promise<MainInfoListResponse> =>
  request<MainInfoListResponse>(`${service}main/info-list`, {
    method: "POST",
    data: options,
  });
