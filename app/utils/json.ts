import { logger } from "@mptool/enhance";
import {
  dirname,
  exists,
  mkdir,
  readJSON,
  rm,
  saveOnlineFile,
} from "@mptool/file";

import { server } from "../config/info.js";

/**
 * 保存 JSON
 *
 * @param onlinePath JSON 的在线路径，不带 `.json` 后缀
 * @param localPath JSON 的保存路径，不带 `.json` 后缀
 */
export const saveJSON = (
  onlinePath: string,
  localPath = onlinePath,
): Promise<void> => {
  mkdir(dirname(localPath));

  return saveOnlineFile(`${server}${onlinePath}.json`, `${localPath}.json`)
    .then(() => {
      logger.debug(`Save ${onlinePath}.json success`);

      return Promise.resolve();
    })
    .catch((err: string | number) => {
      logger.error(`Download ${onlinePath}.json failed with error:`, err);
      rm(`${localPath}.json`);

      return Promise.reject(err);
    });
};

/**
 * 确保 JSON 存在
 *
 * @param path JSON 的本地路径，不带 `.json` 后缀
 * @param url JSON 的在线路径，不带 `.json` 后缀以及 `server` 前缀
 */
export const ensureJSON = (path: string, url = `r/${path}`): Promise<void> => {
  if (exists(`${path}.json`)) return Promise.resolve();

  logger.info(`Fetching ${url}.json`);

  mkdir(dirname(path));

  return saveJSON(url, path);
};

/**
 * 获取 JSON
 *
 * @param path JSON 的本地路径，不带 `.json` 后缀
 * @param url JSON 的在线路径，不带 `.json` 后缀以及 `server` 前缀
 */
export const getJSON = <T>(path: string, url = `r/${path}`): Promise<T> =>
  ensureJSON(path, url)
    .then(() => {
      const data = readJSON<T>(path);

      if (typeof data !== "undefined") return data;

      return Promise.reject("Data returned with undefined");
    })
    .catch((err) => Promise.reject(err));
