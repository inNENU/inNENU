import type { InfoType } from "../../service/index.js";

const titleMap: Record<InfoType, string> = {
  news: "要闻速递",
  media: "媒体师大",
  social: "人文社科",
  science: "自然科学",
};

export const getTitle = (type: InfoType): string => titleMap[type];
