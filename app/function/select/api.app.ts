import type { SelectLoginResponse } from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import { AccountInfo } from "../../utils/typings.js";

export * from "./info.js";
export * from "./getAmount.js";
export * from "./process.js";
export * from "./search.js";

export const login = (options: AccountInfo): Promise<SelectLoginResponse> =>
  request<SelectLoginResponse>(`${service}select/login`, {
    method: "POST",
    data: options,
  });
