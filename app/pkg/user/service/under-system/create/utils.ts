import { logger } from "@mptool/all";

import { request } from "../../../../../api/index.js";
import { UNDER_SYSTEM_SERVER } from "../utils.js";

export const nextLinkRegExp =
  /<input\s+type="button"\s+class="button"\s+onclick="window.location.href='([^']+)';"\s+value=" 下一步 "\/>/u;
export const pathRegExp = /<form action="([^"]+)"/u;
export const infoRowRegExp =
  /<tr height="25px"\s*><td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<\/tr>/gu;
export const info2RowRegExp =
  /<tr height="25px"\s*><td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<\/tr>/gu;
export const requiredRegExp = /<font color="red">\*<\/font>/u;
export const readonlyRegExp = /<font[^>]+>ø<\/font>/u;
export const inputRegExp = /<input[^>]*name="(.*?)"[^>]*value="(.*?)"[^>]*\/>/u;
export const checkBoxRegExp = /<input type="checkbox" value="(.*?)" id="gx" name="(.*?)"[^>]+\/>/u;
export const selectRegExp = /<select[^>]+name="(.*?)"/u;
export const optionRegExp = /<option value="([^"]+)">([^<]*?)<\/option>/gu;
export const fieldsRegExp =
  /<input\s+type="text"[^>]+name="(.*?)"\s+id=".*?"\s+value="(.*?)"[^>]+\/>/gu;
export const hiddenFieldsRegExp = /<input\s+type="hidden"[^>]+name="(.*?)"\s*value="(.*?)"\s*\/>/gu;
export const studyDataRegExp = /"brjl"\s*:\s*(\[.*?\])/u;
export const familyDataRegExp = /"jtcy"\s*:\s*(\[.*?\])/u;

export const onlineUnderStudentArchive = <Response>(
  options: Record<string, unknown> = {},
): Promise<Response> =>
  request("/under-system/create-archive", {
    method: "POST",
    body: options,
    cookieScope: UNDER_SYSTEM_SERVER,
  }).then(({ data }) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data as Response;
  });
