import { request } from "../../api/index.js";
import { user } from "../../state/index.js";

export const reportUserInfo = (
  data: Record<string, unknown> = { type: "contact" },
): Promise<void> =>
  request<never>("/mp/report", {
    method: "POST",
    body: {
      ...data,
      ...user,
    },
  }).then(({ data }) => data);
