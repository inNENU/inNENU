export const UNDER_SYSTEM_DOMAIN = "dsjx.webvpn.nenu.edu.cn";
export const UNDER_SYSTEM_SERVER = `https://${UNDER_SYSTEM_DOMAIN}`;

export const keyCodeRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"keyCode"\s+id\s*=\s*"keyCode"\s+value="([^"]*?)">/u;
export const printHQLInputRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"printHQL"\s+id\s*=\s*"printHQL"\s+value="([^"]*?)">/u;
export const printHQLJSRegExp =
  /window\.parent\.document\.getElementById\('printHQL'\)\.value = '([^']*?)';/u;
export const printPageSizeRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"printPageSize"\s+id\s*=\s*"printPageSize"\s+value="([^"]*?)">/u;
export const sqlStringRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"sqlString"\s+id\s*=\s*"sqlString"\s+value="([^"]*?)">/u;
export const fieldRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"field"\s+id\s*=\s*"field"\s+value="([^"]*?)">/u;
export const totalPagesRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"totalPages"\s+id\s*=\s*"totalPages"\s+value="([^"]*?)">/u;
export const tableFieldsRegExp =
  /<input type="hidden"\s+name\s*=\s*"tableFields"\s+id\s*=\s*"tableFields"\s+value="([^"]+?)">/u;
export const otherFieldsRegExp =
  /<input\s+type="hidden"\s+name\s*=\s*"otherFields"\s+id\s*=\s*"otherFields"\s+value="([^"]*?)">/u;
