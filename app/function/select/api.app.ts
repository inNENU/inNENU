import {
  type ProcessFailedResponse,
  type ProcessOptions,
  type ProcessResponse,
  type ProcessSuccessResponse,
  type SearchOptions,
  type SelectBaseOptions,
  type SelectInfoResponse,
  type SelectLoginOptions,
  type SelectLoginResponse,
  type SelectSearchResponse,
  type StudentAmountOptions,
  type StudentAmountResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/info.js";

export const login = (
  options: SelectLoginOptions,
): Promise<SelectLoginResponse> =>
  request<SelectLoginResponse>(`${service}select/login`, {
    method: "POST",
    data: options,
  });

export const getInfo = (
  options: SelectBaseOptions,
): Promise<SelectInfoResponse> =>
  request<SelectInfoResponse>(`${service}select/info`, {
    method: "POST",
    data: options,
  });

export const process = (
  type: "add" | "delete",
  { cookies, server, id, jx0502id, jx0502zbid }: ProcessOptions,
): Promise<ProcessResponse> =>
  new Promise((resolve, reject) => {
    const params = Object.entries({
      jx0502id,
      jx0502zbid,
      jx0404id: id,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    wx.request<{ msgContent: string }>({
      method: "POST",
      url: `${server}xk/process${type === "delete" ? "Tx" : "Xk"}`,
      header: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies.join(", "),
      },
      data: params,
      enableHttp2: true,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          try {
            const { msgContent: msg } = data;

            if (msg === "系统更新了选课数据,请重新登录系统")
              return resolve(<ProcessFailedResponse>{
                success: false,
                msg,
                type: "relogin",
              });

            if (msg === "您的账号在其它地方登录")
              return resolve(<ProcessFailedResponse>{
                success: false,
                msg,
                type: "relogin",
              });

            if (type === "delete") {
              if (msg.includes("退选成功"))
                return resolve(<ProcessSuccessResponse>{
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
                return resolve(<ProcessSuccessResponse>{
                  success: true,
                  msg,
                });
            }

            return resolve(<ProcessFailedResponse>{
              success: false,
              msg,
            });
          } catch (err) {
            console.error(err);
          }
        }

        resolve(<ProcessFailedResponse>{
          success: false,
          msg: "参数有误",
        });
      },
      fail: () => reject(),
    });
  });

export const search = (options: SearchOptions): Promise<SelectSearchResponse> =>
  request<SelectSearchResponse>(`${service}select/search`, {
    method: "POST",
    data: options,
  });

export const getAmount = (
  options: StudentAmountOptions,
): Promise<StudentAmountResponse> =>
  request<StudentAmountResponse>(`${service}select/student-amount`, {
    method: "POST",
    data: options,
  });
