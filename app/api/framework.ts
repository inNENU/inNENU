// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentPage = <T extends Record<string, any>>():
  | (T & WechatMiniprogram.Page.TrivialInstance)
  | null => {
  const pages = getCurrentPages() as (T &
    WechatMiniprogram.Page.TrivialInstance)[];

  return pages[pages.length - 1] || null;
};

export const getCurrentRoute = (): string => getCurrentPage()?.route || "";
