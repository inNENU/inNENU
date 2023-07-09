import { logger } from "@mptool/enhance";

import { showToast } from "./ui.js";
import { assets, server, service } from "../config/info.js";

/** 网络状态汇报 */
export const netReport = (): void => {
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

export type FetchOptions = Pick<
  WechatMiniprogram.RequestOption,
  "data" | "header" | "method" | "timeout"
>;

/**
 * 执行网络请求
 *
 * @param url 请求路径
 * @param successFunc 回调函数
 * @param failFunc 失败回调函数
 * @param errorFunc 状态码错误回调函数
 */
export const request = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<never, never> | unknown[] | string = Record<string, any>
>(
  url: string,
  options: FetchOptions
): Promise<T> =>
  new Promise((resolve, reject) => {
    wx.request<T>({
      url: url.startsWith("http") ? url : `${service}${url}`,
      enableHttp2: true,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          // 调试
          logger.debug(`Request response: `, data);
          resolve(data);
        } else {
          showToast("小程序服务器出错，请稍后重试");
          // 调试
          logger.warn(
            `Request ${url}.json failed with statusCode: ${statusCode}`
          );

          wx.reportEvent?.("service_error", {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            url,
            payload: JSON.stringify(options),
          });

          reject(statusCode);
        }
      },
      fail: ({ errMsg }) => {
        reject(errMsg);

        // 调试
        logger.warn(`Request ${url}.json failed: ${errMsg}`);
      },
      ...options,
    });
  });

/**
 * 执行 JSON 请求
 *
 * @param path 请求路径
 */
export const requestJSON = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<never, never> | unknown[] | string = Record<string, any>
>(
  path: string
): Promise<T> =>
  new Promise((resolve, reject) => {
    wx.request<T>({
      url: path.startsWith("http") ? path : `${server}${path}.json`,
      enableHttp2: true,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          // 调试
          logger.debug(`Request ${path}.json: `, data);

          resolve(data);
        } else {
          showToast("服务器出现问题，请稍后重试");
          // 调试
          logger.warn(
            `Request ${path}.json failed with statusCode: ${statusCode}`
          );

          wx.reportEvent?.("resource_load_failed", {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            broken_url: path,
          });

          reject(statusCode);
        }
      },
      fail: ({ errMsg }) => {
        reject(errMsg);
        netReport();

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
          showToast("服务器出现问题，请稍后重试");

          // 调试
          logger.warn(`Download ${path} failed with statusCode: ${statusCode}`);

          reject(statusCode);
        }
      },
      fail: ({ errMsg }) => {
        wx.hideLoading();

        reject(errMsg);

        netReport();
        logger.warn(`Download ${path} failed:`, errMsg);
      },
    });

    progress.onProgressUpdate(({ progress }) => {
      wx.showLoading({ title: `下载中...${Math.round(progress)}%`, mask });
    });
  });
