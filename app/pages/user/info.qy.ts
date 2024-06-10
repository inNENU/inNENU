import { info } from "../../state/index.js";

const { envName, version } = info;

export const footer = `\
当前版本: ${version}
Mr.Hope 已授权东北师范大学团委融媒体中心使用${envName}代码。
${envName}由 Mr.Hope 个人制作，如有错误还请见谅
`;
