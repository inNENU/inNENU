import type { WidgetConfig } from "./utils.js";

export interface WidgetInfo {
  tag: string;
  name: string;
  types: string[];
}

export const WIDGETS: WidgetInfo[] = [
  {
    tag: "card",
    name: "校园卡",
    types: ["校园卡", "校园卡余额 (小)", "校园卡二维码 (小)"],
  },
  {
    tag: "course",
    name: "课程表",
    types: ["今日课程 (小)", "下节课程 (小)", "今日课程", "课程表 (大)"],
  },
  {
    tag: "email",
    name: "校园邮箱",
    types: ["未读邮件 (小)", "最近邮件 (小)", "最近邮件", "最近邮件 (大)"],
  },
  {
    tag: "recent-notice",
    name: "学校通知",
    types: ["通知 (小)", "通知", "通知 (大)", "新闻 (小)", "新闻", "新闻 (大)"],
  },
  {
    tag: "starred-notice",
    name: "通知收藏",
    types: ["通知收藏 (小)", "通知收藏", "通知收藏 (大)"],
  },
  {
    tag: "recent-academic",
    name: "学术预告",
    types: ["学术预告 (小)", "学术预告", "学术预告 (大)"],
  },
  {
    tag: "recent-announcement",
    name: "通知公告",
    types: ["通知公告 (小)", "通知公告", "通知公告 (大)"],
  },
  {
    tag: "recent-info",
    name: "官网信息",
    types: [
      "要闻速递 (小)",
      "要闻速递",
      "要闻速递 (大)",
      "媒体师大 (小)",
      "媒体师大",
      "媒体师大 (大)",
      "人文社科 (小)",
      "人文社科",
      "人文社科 (大)",
      "自然科学 (小)",
      "自然科学",
      "自然科学 (大)",
    ],
  },
  {
    tag: "starred-info",
    name: "官网收藏",
    types: ["官网收藏 (小)", "官网收藏", "官网收藏 (大)"],
  },
  {
    tag: "weather",
    name: "学校天气",
    types: [
      "今日天气 (小)",
      "今日天气",
      "近日天气 (小)",
      "近日天气",
      "近日天气 (大)",
    ],
  },
  {
    tag: "library-people",
    name: "图书馆人数",
    types: ["图书馆人数 (小)"],
  },
  {
    tag: "library-borrow",
    name: "图书馆借阅",
    types: ["借阅书目 (小)", "图书待还 (小)"],
  },
];

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    tag: "card",
    type: "校园卡 (小)",
    size: "small",
  },
  {
    tag: "weather",
    type: "今日天气 (小)",
    size: "small",
  },
  {
    tag: "course",
    type: "下节课程 (小)",
    size: "small",
  },
  {
    tag: "course",
    type: "今日课程 (小)",
    size: "small",
  },
  {
    tag: "recent-notice",
    type: "近期通知",
    size: "medium",
  },
];
