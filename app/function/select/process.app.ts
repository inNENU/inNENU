import type { ProcessOptions, ProcessResponse } from "./typings.js";
import { request } from "../../api/index.js";
import { LoginFailType } from "../../login/loginFailTypes.js";

export const process = (
  type: "add" | "delete",
  { server, courseId, jx0502id, jx0502zbid }: ProcessOptions,
): Promise<ProcessResponse> =>
  new Promise((resolve, reject) => {
    const params = Object.entries({
      jx0502id,
      jx0502zbid,
      jx0404id: courseId,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    request<{ msgContent: string }>(
      `${server}xk/process${type === "delete" ? "Tx" : "Xk"}`,
      {
        method: "POST",
        header: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: params,
      },
    )
      .then((data) => {
        const { msgContent: msg } = data;

        if (msg === "系统更新了选课数据,请重新登录系统")
          return resolve({
            success: false,
            msg,
            type: LoginFailType.Expired,
          });

        if (msg === "您的账号在其它地方登录")
          return resolve({
            success: false,
            msg,
            type: LoginFailType.Expired,
          });

        if (type === "delete") {
          if (msg.includes("退选成功"))
            return resolve({
              success: true,
              msg,
            });
        } else {
          if (msg.endsWith("上课时间冲突"))
            return resolve({
              success: false,
              msg,
              type: "conflict",
            });

          if (msg.includes("选课成功"))
            return resolve({
              success: true,
              msg,
            });
        }

        return resolve({
          success: false,
          msg,
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
