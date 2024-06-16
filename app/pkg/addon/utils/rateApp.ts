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
      console.log("plugin.openComment success", res);
    },
    fail: (res) => {
      console.log("plugin.openComment fail", res);
    },
  });
};
