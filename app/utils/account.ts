import { type AccountInfo } from "./app.js";
import { service } from "./config.js";

interface SelectLoginSuccessResponse {
  status: "success";
  cookie: string;
  server: string;
}

export const validateAccount = ({
  id,
  password,
}: AccountInfo): Promise<boolean> =>
  new Promise((resolve, reject) => {
    wx.request<SelectLoginSuccessResponse>({
      method: "POST",
      url: `${service}select/login`,
      data: { id, password },
      success: ({ data, statusCode }) => {
        resolve(statusCode === 200 && data.status === "success");
      },
      fail: () => reject(),
    });
  });
