import { logger } from "@mptool/all";

export const rateApp = (): void => {
  (
    requirePlugin("wxacommentplugin") as {
      openComment: (option: {
        success: (res: unknown) => void;
        fail: (res: unknown) => void;
      }) => void;
    }
  ).openComment({
    success: (res) => {
      logger.debug("plugin.openComment success", res);
    },
    fail: (res) => {
      logger.error("打开评论页失败", res);
    },
  });
};
