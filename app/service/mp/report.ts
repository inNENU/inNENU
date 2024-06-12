import { request } from "../../api/index.js";
import { user } from "../../state/index.js";

export const reportUserInfo = (): Promise<void> =>
  request<never>("/mp/report", {
    method: "POST",
    body: {
      type: "contact",
      ...user,
    },
  }).then(({ data }) => data);