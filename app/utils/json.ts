import { dirname, exists, logger, mkdir, readJSON, rm, saveOnlineFile } from "@mptool/all";

import { server } from "../config/index.js";

/**
 * 保存 JSON
 *
 * @param onlinePath JSON 的在线路径，不带 `.json` 后缀
 * @param localPath JSON 的保存路径，不带 `.json` 后缀
 */
export const saveJson = async (onlinePath: string, localPath = onlinePath): Promise<void> => {
  mkdir(dirname(localPath));

  try {
    await saveOnlineFile(`${server}${onlinePath}.json`, `${localPath}.json`);
    logger.debug(`Save ${onlinePath} success`);
  } catch (err) {
    logger.error(`下载 ${onlinePath}.json 失败`, err);
    rm(`${localPath}.json`);

    throw err;
  }
};

/**
 * 确保 JSON 存在
 *
 * @param path JSON 的本地路径，不带 `.json` 后缀
 * @param url JSON 的在线路径，不带 `.json` 后缀以及 `server` 前缀
 */
export const ensureJson = async (path: string, url = path): Promise<void> => {
  if (exists(`${path}.json`)) return;

  logger.debug(`Fetching ${url}.json`);

  mkdir(dirname(path));

  await saveJson(url, path);
};

/**
 * 获取 JSON
 *
 * @param path JSON 的本地路径，不带 `.json` 后缀
 * @param url JSON 的在线路径，不带 `.json` 后缀以及 `server` 前缀
 *
 * @returns JSON 数据
 */
export const getJson = async <T>(path: string, url = path): Promise<T> => {
  await ensureJson(path, url);

  const data = readJSON<T>(path);

  // oxlint-disable-next-line no-undefined
  if (data !== undefined) return data;

  throw new Error("Data returned with undefined");
};
