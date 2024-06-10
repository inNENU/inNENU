import type {
  ProcessOptions,
  ProcessResponse,
  SearchOptions,
  SelectInfoOptions,
  SelectInfoResponse,
  SelectLoginResponse,
  SelectSearchResponse,
  StudentAmountOptions,
  StudentAmountResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import type { AccountInfo } from "../../state/index.js";

export const login = (options: AccountInfo): Promise<SelectLoginResponse> =>
  request<SelectLoginResponse>("/select/login", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);

export const getInfo = (
  options: SelectInfoOptions,
): Promise<SelectInfoResponse> =>
  request<SelectInfoResponse>("/select/info", {
    method: "POST",
    body: options,
    cookieScope: options.server,
  }).then(({ data }) => data);

export const process = (
  type: "add" | "delete",
  options: ProcessOptions,
): Promise<ProcessResponse> =>
  request<ProcessResponse>("/select/process", {
    method: type === "delete" ? "DELETE" : "PUT",
    body: options,
    cookieScope: options.server,
  }).then(({ data }) => data);

export const search = (options: SearchOptions): Promise<SelectSearchResponse> =>
  request<SelectSearchResponse>("/select/search", {
    method: "POST",
    body: options,
    cookieScope: options.server,
  }).then(({ data }) => data);

export const getAmount = (
  options: StudentAmountOptions,
): Promise<StudentAmountResponse> =>
  request<StudentAmountResponse>("/select/student-amount", {
    method: "POST",
    body: options,
    cookieScope: options.server,
  }).then(({ data }) => data);
