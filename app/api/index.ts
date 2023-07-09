export { savePhoto } from "./media.js";
export { downLoad, netReport, fetch, requestJSON } from "./net.js";
export { addPhoneContact } from "./phone.js";
export {
  confirmAction,
  getDarkmode,
  getWindowInfo,
  showModal,
  showToast,
} from "./ui.js";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentPage = <T extends Record<string, any>>():
  | (T & WechatMiniprogram.Page.TrivialInstance)
  | null => {
  const pages = <(T & WechatMiniprogram.Page.TrivialInstance)[]>(
    getCurrentPages()
  );

  return pages[pages.length - 1] || null;
};
