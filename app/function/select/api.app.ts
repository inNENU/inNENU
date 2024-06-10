import type { SelectLoginResponse } from "./typings.js";
import { request } from "../../api/index.js";
import type { AccountInfo } from "../../state/index.js";

export * from "./info.js";
export * from "./getAmount.js";
export * from "./process.js";
export * from "./search.js";

export const login = (options: AccountInfo): Promise<SelectLoginResponse> =>
  request<SelectLoginResponse>("/select/login", {
    method: "POST",
    body: options,
  }).then(({ data }) => data);
