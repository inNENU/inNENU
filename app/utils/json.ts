import type { MpError } from "@mptool/all";
import {
  dirname,
  exists,
  logger,
  mkdir,
  readJSON,
  rm,
  saveOnlineFile,
} from "@mptool/all";

import { server } from "../config/index.js";

/**
 * 保存 JSON
 *
 * @param onlinePath JSON 的在线路径，不带 `.json` 后缀
 * @param localPath JSON 的保存路径，不带 `.json` 后缀
 */
export const saveJson = (
  onlinePath: string,
  localPath = onlinePath,
): Promise<void> => {
  mkdir(dirname(localPath));

  return saveOnlineFile(`${server}${onlinePath}.json`, `${localPath}.json`)
    .then(() => {
      logger.debug(`Save ${onlinePath} success`);

      return;
    })
    .catch((err: MpError) => {
      logger.error(`Download ${onlinePath} failed with error:`, err);
      rm(`${localPath}.json`);

      throw err;
    });
};

/**
 * 确保 JSON 存在
 *
 * @param path JSON 的本地路径，不带 `.json` 后缀
 * @param url JSON 的在线路径，不带 `.json` 后缀以及 `server` 前缀
 */
export const ensureJson = (path: string, url = `d/${path}`): Promise<void> => {
  if (exists(`${path}.json`)) return Promise.resolve();

  logger.debug(`Fetching ${url}.json`);

  mkdir(dirname(path));

  return saveJson(url, path);
};

/**
 * 获取 JSON
 *
 * @param path JSON 的本地路径，不带 `.json` 后缀
 * @param url JSON 的在线路径，不带 `.json` 后缀以及 `server` 前缀
 */
export const getJson = <T>(path: string, url = `d/${path}`): Promise<T> =>
  ensureJson(path, url)
    .then(() => {
      const data = readJSON<T>(path);

      if (typeof data !== "undefined") return data;

      return Promise.reject(new Error("Data returned with undefined"));
    })
    .catch((err) => Promise.reject(err as Error));
