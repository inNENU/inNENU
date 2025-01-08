import { server } from "./server.js";

// @ts-expect-error: DEBUG is not standard
wx.env.DEBUG = true;

/** 小程序名称 */
export const appName = "inNENU";
export const description = "在东师，就用 inNENU";
/** 小程序版本 */
export const version = "7.2.0";

export const appCoverPrefix = `${server}img/inNENU`;
export const logo = "/frameset/placeholder.png";
export const imageWaterMark =
  "?x-oss-process=image/watermark,text_aW7kuJzluIjvvIzlsLHnlKg,image_aW1nL2luTkVOVS5wbmc_eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsUF80,type_ZmFuZ3poZW5nc2h1c29uZw,order_1,align_1,interval_8,size_16";
