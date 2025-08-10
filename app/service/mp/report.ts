import { request } from "../../api/index.js";
import { user } from "../../state/index.js";

export const reportUserInfo = (
  type = "contact",
  data: Record<string, unknown> = {},
): Promise<void> =>
  request<never>("/mp/report", {
    method: "POST",
    body: {
      ...data,
      ...user,
      type,
    },
  }).then(({ data }) => data);
