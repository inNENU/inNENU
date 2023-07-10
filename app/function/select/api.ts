import {
  type ProcessOptions,
  type ProcessResponse,
  type SearchOptions,
  type SelectBaseOptions,
  type SelectInfoResponse,
  type SelectLoginOptions,
  type SelectLoginResponse,
  type SelectSearchResponse,
  type StudentAmountOptions,
  type StudentAmountResponse,
} from "./typings.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const login = (
  options: SelectLoginOptions,
): Promise<SelectLoginResponse> =>
  request<SelectLoginResponse>(`${service}select/login`, {
    method: "POST",
    data: options,
  });

export const getInfo = (
  options: SelectBaseOptions,
): Promise<SelectInfoResponse> =>
  request<SelectInfoResponse>(`${service}select/info`, {
    method: "POST",
    data: options,
  });

export const process = (
  type: "add" | "delete",
  options: ProcessOptions,
): Promise<ProcessResponse> =>
  request<ProcessResponse>(`${service}select/process`, {
    method: type === "delete" ? "DELETE" : "PUT",
    data: options,
  });

export const search = (options: SearchOptions): Promise<SelectSearchResponse> =>
  request<SelectSearchResponse>(`${service}select/search`, {
    method: "POST",
    data: options,
  });

export const getAmount = (
  options: StudentAmountOptions,
): Promise<StudentAmountResponse> =>
  request<StudentAmountResponse>(`${service}select/student-amount`, {
    method: "POST",
    data: options,
  });
