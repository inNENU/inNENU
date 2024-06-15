import { logger } from "@mptool/all";

import { request } from "../../../../../api/index.js";
import { UNDER_SYSTEM_SERVER } from "../utils.js";

export const nextLinkRegExp =
  /<input\s+type="button"\s+class="button"\s+onclick="window.location.href='([^']+)';"\s+value=" 下一步 "\/>/;
export const pathRegExp = /<form action="([^"]+)"/;
export const infoRowRegExp =
  /<tr height="25px"\s*><td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<\/tr>/g;
export const info2RowRegExp =
  /<tr height="25px"\s*><td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<\/tr>/g;
export const requiredRegExp = /<font color="red">\*<\/font>/;
export const readonlyRegExp = /<font[^>]+>ø<\/font>/;
export const inputRegExp = /<input[^>]*name="(.*?)"[^>]*value="(.*?)"[^>]*\/>/;
export const checkBoxRegExp =
  /<input type="checkbox" value="(.*?)" id="gx" name="(.*?)"[^>]+\/>/;
export const selectRegExp = /<select[^>]+name="(.*?)"/;
export const optionRegExp = /<option value="([^"]+)">([^<]*?)<\/option>/g;
export const fieldsRegExp =
  /<input\s+type="text"[^>]+name="(.*?)"\s+id=".*?"\s+value="(.*?)"[^>]+\/>/g;
export const hiddenFieldsRegExp =
  /<input\s+type="hidden"[^>]+name="(.*?)"\s*value="(.*?)"\s*\/>/g;
export const studyDataRegExp = /"brjl"\s*:\s*(\[.*?\])/;
export const familyDataRegExp = /"jtcy"\s*:\s*(\[.*?\])/;

export const onlineUnderStudentArchive = <Option, Response>(
  options: Option,
  additionalOptions: Record<string, unknown> = {},
): Promise<Response> =>
  request("/under-system/create-archive", {
    method: "POST",
    body: { ...additionalOptions, ...options },
    cookieScope: UNDER_SYSTEM_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  }) as Promise<Response>;
