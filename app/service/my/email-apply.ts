import { logger } from "@mptool/all";

import { MY_SERVER } from "./utils.js";
import { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

export const onlineMyEmail = async (): Promise<CommonFailedResponse> =>
  request<CommonFailedResponse>("/my/email", {
    method: "POST",
    cookieScope: MY_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("邮箱接口出错", data);

    return data;
  });
