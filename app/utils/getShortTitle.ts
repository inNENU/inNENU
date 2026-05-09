export const getShortTitle = (title: string): string =>
  title.replace(/^关于/gu, "").replace(/的通知$/gu, "");
