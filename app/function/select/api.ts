import type {
  ProcessOptions,
  ProcessResponse,
  SearchOptions,
  SelectBaseOptions,
  SelectInfoResponse,
  SelectLoginOptions,
  SelectLoginResponse,
  SelectSearchResponse,
  StudentAmountOptions,
  StudentAmountResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";

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
