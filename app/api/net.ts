import { MpError, createRequest, logger } from "@mptool/all";

import { showToast } from "./ui.js";
import { assets, server, service } from "../config/index.js";

/** 网络状态汇报 */
export const networkReport = (): void => {
  // 获取网络信息
  wx.getNetworkType({
    success: ({ networkType }) => {
      switch (networkType) {
        case "2g":
        case "3g":
          showToast("您的网络状态不佳");
          break;
        case "none":
          showToast("您没有连接到网络");
          break;
        case "wifi":
          wx.getConnectedWifi({
            success: ({ wifi }) => {
              if (wifi.signalStrength < 0.5)
                showToast("Wifi信号不佳，网络链接失败");
            },
            fail: () => {
              showToast("无法连接网络");
            },
          });
          break;
        default:
          showToast("网络连接出现问题，请稍后重试");
      }

      logger.warn("Request fail with", networkType);
    },
    fail: () => {
      showToast("网络连接出现问题，请稍后重试");

      logger.warn("Request fail and cannot get networkType");
    },
  });
};

const { request, cookieStore } = createRequest({
  server: service,
  timeout: 30000,
  cookieStore: "innenu-v1",
  responseHandler: ({ data, headers, status }, url, options) => {
    if (status < 500) {
      // 调试
      logger.info(
        `Request ${url} ends with ${status}: `,
        headers.toObject(),
        typeof data === "string" && data.length > 200
          ? data.slice(0, 200)
          : data,
      );

      return { data, headers, status };
    }

    const msg = `Request ${url} failed with statusCode: ${status}`;

    // 调试
    logger.warn(msg);

    wx.reportEvent?.("service_error", {
      url,
      payload: JSON.stringify(options),
    });

    showToast(`${url.includes("innenu.com") ? "小程序" : "学校"}服务器故障`);

    const error = new Error(msg);

    // @ts-expect-error: Upstream type definition improvement
    error.status = status;

    throw error;
  },
  errorHandler: (err, url) => {
    logger.warn(`Request ${url} failed:`, err);
    networkReport();
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
        networkReport();

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
export const downLoad = (path: string, mask = false): Promise<string> =>
  new Promise((resolve, reject) => {
    const progress = wx.downloadFile({
      url: path.startsWith("http") ? path : `${assets}${path}`,
      success: ({ statusCode, tempFilePath }) => {
        wx.hideLoading();
        if (statusCode === 200) {
          resolve(tempFilePath);
        } else {
          const errorMsg = `Download ${path} failed with statusCode: ${statusCode}`;

          showToast("下载失败");
          logger.warn(errorMsg);
          reject(new MpError({ code: statusCode, message: errorMsg }));
        }
      },
      fail: ({ errMsg }) => {
        wx.hideLoading();

        reject(new MpError({ message: errMsg }));

        networkReport();
        logger.warn(`Download ${path} failed:`, errMsg);
      },
    });

    progress.onProgressUpdate(({ progress }) => {
      wx.showLoading({ title: `下载中...${Math.round(progress)}%`, mask });
    });
  });
