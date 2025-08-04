import { env, go, logger, showModal, writeClipboard } from "@mptool/all";
import type {
  ChannelProfileOptions,
  ChannelVideoOptions,
  MiniProgramFullOptions,
  MiniProgramShortLinkOptions,
  OfficialArticleOptions,
  OfficialProfileOptions,
  PathOptions,
  UrlOptions,
} from "innenu-generator/typings";

import { showOfficialQRCode } from "./wechat.js";

export const route = (
  options:
    | PathOptions
    | UrlOptions
    | OfficialProfileOptions
    | OfficialArticleOptions
    | ChannelProfileOptions
    | ChannelVideoOptions
    | MiniProgramFullOptions
    | MiniProgramShortLinkOptions
    | Record<never, never>,
  referrer?: string,
): void => {
  if ("action" in options) {
    switch (options.action) {
      case "official": {
        const { username } = options;

        if (wx.openOfficialAccountProfile)
          wx.openOfficialAccountProfile({
            username,
            fail: () => showOfficialQRCode(username),
          });
        else showOfficialQRCode(username);
        break;
      }

      case "article": {
        const { url } = options;

        if (wx.openOfficialAccountArticle)
          wx.openOfficialAccountArticle({ url });
        else if (env === "donut") wx.miniapp.openUrl({ url });
        else
          writeClipboard(url).then(() => {
            showModal(
              "无法打开",
              "暂不支持打开微信图文，链接已复制至剪切板，请打开浏览器粘贴查看。",
            );
          });
        break;
      }

      case "channel": {
        const { id, username } = options;

        if (wx.openChannelsUserProfile)
          wx.openChannelsUserProfile({ finderUserName: id });
        else
          writeClipboard(username).then(() => {
            showModal(
              "暂不支持",
              `暂不支持打开微信视频号，视频号名称 ${username} 已复制，请自行搜索。`,
            );
          });
        break;
      }

      case "video": {
        const { id, username } = options;

        if (wx.openChannelsActivity)
          wx.openChannelsActivity({
            finderUserName: username,
            feedId: id,
            nonceId: "",
          });
        else
          writeClipboard(username).then(() => {
            showModal(
              "暂不支持",
              `暂不支持打开微信视频，视频号名称 ${username} 已复制，请自行搜索。`,
            );
          });
        break;
      }

      case "miniProgram": {
        if ("appId" in options) {
          const { appId, path, extraData, versionType } = options;

          if (env === "wx") {
            wx.openEmbeddedMiniProgram({
              appId,
              path,
              extraData,
              envVersion: versionType,
              allowFullScreen: true,
              noRelaunchIfPathUnchanged: true,
            });
          } else if (env === "donut") {
            wx.miniapp.launchMiniProgram({
              userName: appId,
              path,
              miniprogramType:
                versionType === "develop" ? 1 : versionType === "trial" ? 2 : 0,
            });
          } else {
            showModal("无法打开", "暂不支持打开微信小程序");
          }
        } else if ("shortLink" in options) {
          const { shortLink, extraData, versionType } = options;

          if (env === "wx") {
            wx.navigateToMiniProgram({
              shortLink,
              extraData,
              envVersion: versionType,
            });
          } else {
            showModal("无法打开", "暂不支持打开微信小程序");
          }
        }

        break;
      }

      default: {
        // @ts-expect-error: action is unknown here
        logger.error(`未知的路由行为: ${options.action}`);
      }
    }
  } else if ("url" in options) {
    const { url } = options;

    go(`${url}${url.includes("?") ? `&` : `?`}from=${referrer}`);
  } else if ("path" in options) {
    go(`info?id=${options.path}&from=${referrer || "返回"}`);
  }
};
