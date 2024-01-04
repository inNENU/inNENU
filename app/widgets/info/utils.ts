import {
  SITE_MEDIA_LIST_KEY,
  SITE_NEWS_LIST_KEY,
  SITE_SCIENCE_LIST_KEY,
  SITE_SOCIAL_LIST_KEY,
} from "../../config/keys.js";
import type { InfoType } from "../../service/index.js";

const keyMap: Record<InfoType, string> = {
  media: SITE_MEDIA_LIST_KEY,
  news: SITE_NEWS_LIST_KEY,
  science: SITE_SCIENCE_LIST_KEY,
  social: SITE_SOCIAL_LIST_KEY,
};

const titleMap: Record<InfoType, string> = {
  news: "要闻速递",
  media: "媒体师大",
  social: "人文社科",
  science: "自然科学",
};

export const getKey = (type: InfoType): string => keyMap[type];

export const getTitle = (type: InfoType): string => titleMap[type];
