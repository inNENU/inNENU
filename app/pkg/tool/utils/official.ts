import type { OfficialInfoType } from "../../../service/index.js";

const officialTitleMap: Record<OfficialInfoType, string> = {
  news: "要闻速递",
  media: "媒体师大",
  social: "人文社科",
  science: "自然科学",
};

export const getOfficialTitle = (type: OfficialInfoType): string =>
  officialTitleMap[type];
