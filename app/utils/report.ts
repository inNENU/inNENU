import { request } from "../api/index.js";
import { user } from "../state/user.js";

export const reportInfo = (): Promise<void> =>
  request<never>("/mp/report", {
    method: "POST",
    body: {
      type: "contact",
      ...user,
    },
  }).then(({ data }) => data);
