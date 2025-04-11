import {
  MpError,
  download as _download,
  createRequest,
  logger,
  reportNetworkStatus,
  showToast,
} from "@mptool/all";

import { assets, server, service } from "../config/index.js";

const { request, cookieStore } = createRequest({
  server: service,
  timeout: 30000,
  cookieStore: "innenu-v1",
  responseHandler: ({ data, headers, status }, url, options) => {
    if (status < 500) {
      // 调试
      logger.debug(
        `Request ${url} ends with ${status}: `,
        headers.toObject(),
        typeof data === "string" && data.length > 200
          ? data.slice(0, 200)
          : data,
      );

      return { data, headers, status };
    }

    wx.reportEvent?.("service_error", {
      url,
      payload: JSON.stringify(options),
    });

    showToast(`${url.includes("innenu.com") ? "小程序" : "学校"}服务器故障`);

    throw new MpError({
      code: status,
      message: `Request ${url} failed with statusCode: ${status}`,
    });
  },
  errorHandler: (err, url) => {
    if (!err.code) {
      logger.warn(`Request ${url} failed:`, err);
      reportNetworkStatus();
    }
    throw err;
  },
});

export { cookieStore, request };

/**
 * 执行 JSON 请求
 *
 * @param path 请求路径
 */
export const requestJSON = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<never, never> | unknown[] | string = Record<string, any>,
>(
  path: string,
): Promise<T> =>
  new Promise((resolve, reject) => {
    wx.request<T>({
      url: path.startsWith("http") ? path : `${server}${path}.json`,
      enableHttp2: true,
      useHighPerformanceMode: true,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          // 调试
          logger.debug(`Request ${path}.json: `, data);

          resolve(data);
        } else {
          // 调试
          logger.warn(
            `Request ${path}.json failed with statusCode: ${statusCode}`,
          );

          wx.reportEvent?.("resource_load_failed", {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            broken_url: path,
          });

          reject(new MpError({ code: statusCode }));
        }
      },
      fail: ({ errMsg }) => {
        reject(new MpError({ message: errMsg }));
        reportNetworkStatus();

        // 调试
        logger.warn(`Request ${path}.json failed: ${errMsg}`);
      },
    });
  });

/**
 * 下载文件
 *
 * @param path 下载路径
 * @param successFunc 成功回调函数
 * @param failFunc 失败回调函数
 * @param errorFunc 状态码错误回调函数
 */
export const download = (path: string, mask = false): Promise<string> =>
  _download(path.startsWith("https://") ? path : `${assets}${path}`, mask);
