import type {
  ProcessOptions,
  ProcessResponse,
  SearchOptions,
  SelectInfoOptions,
  SelectInfoResponse,
  SelectLoginResponse,
  SelectSearchResponse,
  StudentAmountOptions,
  StudentAmountResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/index.js";
import { AccountInfo } from "../../utils/typings.js";

export const login = (options: AccountInfo): Promise<SelectLoginResponse> =>
  request<SelectLoginResponse>(`${service}select/login`, {
    method: "POST",
    data: options,
  });

export const getInfo = (
  options: SelectInfoOptions,
): Promise<SelectInfoResponse> =>
  request<SelectInfoResponse>(`${service}select/info`, {
    method: "POST",
    data: options,
    scope: options.server,
  });

export const process = (
  type: "add" | "delete",
  { server, id, jx0502id, jx0502zbid }: ProcessOptions,
): Promise<ProcessResponse> =>
  new Promise((resolve, reject) => {
    const params = Object.entries({
      jx0502id,
      jx0502zbid,
      jx0404id: id,
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
            type: "relogin",
          });

        if (msg === "您的账号在其它地方登录")
          return resolve({
            success: false,
            msg,
            type: "relogin",
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

export const search = (options: SearchOptions): Promise<SelectSearchResponse> =>
  request<SelectSearchResponse>(`${service}select/search`, {
    method: "POST",
    data: options,
    scope: options.server,
  });

export const getAmount = (
  options: StudentAmountOptions,
): Promise<StudentAmountResponse> =>
  request<StudentAmountResponse>(`${service}select/student-amount`, {
    method: "POST",
    data: options,
    scope: options.server,
  });
