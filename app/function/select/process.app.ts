import type { ProcessOptions, ProcessResponse } from "./typings.js";
import { request } from "../../api/index.js";
import { LoginFailType } from "../../service/index.js";

export const process = (
  type: "add" | "delete",
  { server, courseId, jx0502id, jx0502zbid }: ProcessOptions,
): Promise<ProcessResponse> =>
  new Promise((resolve, reject) => {
    request<{ msgContent: string }>(
      `${server}xk/process${type === "delete" ? "Tx" : "Xk"}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        // this is not encoded
        body: Object.entries({
          jx0502id,
          jx0502zbid,
          jx0404id: courseId,
        })
          .map(([key, value]) => `${key}=${value}`)
          .join("&"),
      },
    )
      .then(({ data: { msgContent: msg } }) => {
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
