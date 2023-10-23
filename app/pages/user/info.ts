import type { AppOption } from "../../app.js";

const { globalData } = getApp<AppOption>();
const { envName, version } = globalData;

export const footer = `\
当前版本: ${version}
${envName}由 Mr.Hope 个人制作，如有错误还请见谅\
`;
