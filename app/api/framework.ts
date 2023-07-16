// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentPage = <T extends Record<string, any>>():
  | (T & WechatMiniprogram.Page.TrivialInstance)
  | null => {
  const pages = <(T & WechatMiniprogram.Page.TrivialInstance)[]>(
    getCurrentPages()
  );

  return pages[pages.length - 1] || null;
};
