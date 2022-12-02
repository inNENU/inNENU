import { logger } from "@mptool/enhance";
import { assets, server } from "./config";

/**
 * 根据用户设置，判断当前小程序是否应启用夜间模式
 *
 * @returns 夜间模式状态
 */
export const getDarkmode = (
  sysInfo: WechatMiniprogram.SystemInfo = wx.getSystemInfoSync()
): boolean => (sysInfo.AppPlatform ? false : sysInfo.theme === "dark");

/**
 * 显示提示文字
 *
 * @param text 提示文字
 * @param duration 提示持续时间，单位 ms，默认为 `1500`
 * @param icon 提示图标，默认为 `'none'`
 */
export const tip = (
  text: string,
  duration = 1500,
  icon: "success" | "loading" | "none" = "none"
): void => {
  wx.showToast({ icon, title: text, duration });
};

/**
 * 显示提示窗口
 *
 * @param title 提示文字
 * @param content 提示文字
 * @param confirmFunc 点击确定的回调函数
 * @param cancelFunc 点击取消的回调函数，不填则不显示取消按钮
 */
export const modal = (
  title: string,
  content: string,
  confirmFunc?: () => void,
  cancelFunc?: () => void
): void => {
  /** 显示取消按钮 */
  const showCancel = Boolean(cancelFunc);

  wx.showModal({
    title,
    content,
    showCancel,
    success: ({ cancel, confirm }) => {
      if (confirm && confirmFunc) confirmFunc();
      else if (cancel && cancelFunc) cancelFunc();
    },
  });
};

/**
 * 确认操作
 *
 * @param actionText 行为文字
 * @param confirmFunc 确定回调函数
 * @param cancelFunc 取消回调函数
 */
export const confirmAction = (
  actionText: string,
  confirmFunc: () => void,
  cancelFunc: () => void = (): void => void 0
): void => {
  modal("确认操作", `您确定要${actionText}么?`, confirmFunc, cancelFunc);
};

/** 网络状态汇报 */
export const netReport = (): void => {
  // 获取网络信息
  wx.getNetworkType({
    success: ({ networkType }) => {
      switch (networkType) {
        case "2g":
        case "3g":
          tip("您的网络状态不佳");
          break;
        case "none":
          tip("您没有连接到网络");
          break;
        case "wifi":
          wx.getConnectedWifi({
            success: ({ wifi }) => {
              if (wifi.signalStrength < 0.5) tip("Wifi信号不佳，网络链接失败");
            },
            fail: () => {
              tip("无法连接网络");
            },
          });
          break;
        default:
          tip("网络连接出现问题，请稍后重试");
      }

      logger.warn("Request fail with", networkType);
    },
    fail: () => {
      tip("网络连接出现问题，请稍后重试");

      logger.warn("Request fail and cannot get networkType");
    },
  });
};

/**
 * 执行 JSON 请求
 *
 * @param path 请求路径
 * @param successFunc 回调函数
 * @param failFunc 失败回调函数
 * @param errorFunc 状态码错误回调函数
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
          tip("服务器出现问题，请稍后重试");
          // 调试
          logger.warn(
            `Request ${path}.json failed with statusCode: ${statusCode}`
          );
          wx.reportMonitor("3", 1);

          reject(statusCode);
        }
      },
      fail: ({ errMsg }) => {
        reject(errMsg);
        netReport();

        // 调试
        logger.warn(`Request ${path}.json failed: ${errMsg}`);
        wx.reportMonitor("4", 1);
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
        if (statusCode === 200) resolve(tempFilePath);
        else {
          tip("服务器出现问题，请稍后重试");

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

/**
 * 保存图片到相册
 *
 * @param imgPath 图片地址
 */
export const savePhoto = (imgPath: string): Promise<void> =>
  new Promise((resolve, reject) => {
    downLoad(imgPath)
      .then((path) => {
        // 获取用户设置
        wx.getSetting({
          success: ({ authSetting }) => {
            // 如果已经授权相册直接写入图片
            if (authSetting["scope.writePhotosAlbum"])
              wx.saveImageToPhotosAlbum({
                filePath: path,
                success: () => resolve(),
              });
            // 没有授权 —> 提示用户授权
            else
              wx.authorize({
                scope: "scope.writePhotosAlbum",
                success: () => {
                  wx.saveImageToPhotosAlbum({
                    filePath: path,
                    success: () => resolve(),
                  });
                },

                // 用户拒绝权限，提示用户开启权限
                fail: () => {
                  modal(
                    "权限被拒",
                    "如果想要保存图片，请在“权限设置”允许保存图片权限",
                    () => {
                      wx.openSetting({
                        success: () => reject(),
                      });
                    }
                  );
                },
              });
          },
        });
      })
      .catch(() => reject());
  });

/**
 * 保存联系人到通讯录
 *
 * @param config 联系人信息
 */
export const addPhoneContact = (
  config: Omit<
    WechatMiniprogram.AddPhoneContactOption,
    "success" | "fail" | "complete"
  >
): Promise<void> =>
  new Promise((resolve, reject) => {
    // 获取用户设置
    wx.getSetting({
      success: ({ authSetting }) => {
        // 如果已经授权直接写入联系人
        if (authSetting["scope.addPhoneContact"])
          wx.addPhoneContact({
            ...config,
            success: () => resolve(),
          });
        // 没有授权 —> 提示用户授权
        else
          wx.authorize({
            scope: "scope.addPhoneContact",
            success: () => {
              wx.addPhoneContact({
                ...config,
                success: () => resolve(),
              });
            },

            // 用户拒绝权限，提示用户开启权限
            fail: () => {
              modal(
                "权限被拒",
                "如果想要保存联系人，请在“权限设置”允许添加到联系人权限",
                () => {
                  wx.openSetting({
                    success: () => reject(),
                  });
                }
              );
            },
          });
      },
    });
  });

export const getWindowInfo = (): WechatMiniprogram.WindowInfo =>
  /** @desc >2.20.1 */
  wx.getWindowInfo?.() || wx.getSystemInfoSync();

/**
 * 比较版本号
 * @param versionA 版本号A
 * @param versionB 版本号B
 */
export const compareVersion = (versionA: string, versionB: string): number => {
  const version1 = versionA.split(".");
  const version2 = versionB.split(".");

  const maxLen = Math.max(version1.length, version2.length);

  while (version1.length < maxLen) version1.push("0");

  while (version2.length < maxLen) version2.push("0");

  for (let i = 0; i < maxLen; i++) {
    const num1 = parseInt(version1[i]);
    const num2 = parseInt(version2[i]);

    if (num1 > num2) return 1;
    else if (num1 < num2) return -1;
  }

  return 0;
};
