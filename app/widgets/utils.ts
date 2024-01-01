export type WidgetSize = "small" | "medium" | "large";
export type WidgetStatus = "loading" | "error" | "login" | "success";

export interface WidgetConfig {
  tag: string;
  type: string;
  size: WidgetSize;
}

export const getSize = (type: string): WidgetSize =>
  type.includes("(大)") ? "large" : type.includes("(小)") ? "small" : "medium";

export const FILTERED_SOURCES = [
  "国际合作与交流处",
  "人事处",
  "科学技术处",
  "发展规划处",
  "社会科学处",
  "资产与实验室管理处",
  "职业与继续教育学院",
  "工会",
];
