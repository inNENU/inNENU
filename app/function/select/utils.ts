import { type CourseInfo } from "./api.app.js";
import { showModal } from "../../api/index.js";

const CONFIRM_KEY = "select-replace-confirmed";

export const confirmReplace = (): Promise<boolean> =>
  new Promise((resolve) => {
    const confirmedReplace = wx.getStorageSync<boolean>(CONFIRM_KEY);

    if (confirmedReplace) return resolve(true);

    showModal(
      "替换课程说明",
      "替换课程有很高的操作风险，请您仔细阅读下方说明。\n在替换课程时，我们会重新查询此课程的人数。当且仅当此课程未满时，我们会立即退选已有课程并立即选择此课程。由于查询人数、退选已有课程和选择新课程是按顺序进行的操作，其他用户可以在查询人数和重新选课之前选中相同的课程，导致您退课成功但因人数重新满额丢失课程。",
      () => {
        const confirmReading = (): void =>
          wx.showModal({
            title: "阅读确认",
            content:
              "我已阅读前页内容并理解我可能通过此操作丢失课程。\n请输入“我已确认”。",
            editable: true,
            confirmText: "输入完成",
            cancelText: "取消",
            success: ({ confirm, content }) => {
              if (confirm) {
                if (content === "我已确认") {
                  resolve(true);
                  wx.setStorageSync(CONFIRM_KEY, true);
                } else confirmReading();
              } else resolve(false);
            },
            fail: () => resolve(false),
          });

        confirmReading();
      },
      () => resolve(false)
    );
  });

export interface FullCourseInfo extends CourseInfo {
  amount: number;
  isSelected: boolean;
}

export type SortKey = "className" | "teacher" | "amount" | "spare" | "capacity";

export const courseSorter =
  (
    sortKey: SortKey,
    ascending: boolean
  ): ((courseA: FullCourseInfo, courseB: FullCourseInfo) => number) =>
  (courseA, courseB) => {
    if (courseA.isSelected) return -1;
    if (courseB.isSelected) return 1;

    const aVal =
      sortKey === "spare"
        ? courseA.capacity - courseA.amount
        : courseA[sortKey];
    const bVal =
      sortKey === "spare"
        ? courseB.capacity - courseB.amount
        : courseB[sortKey];

    if (typeof aVal === "number")
      return ascending ? aVal - <number>bVal : <number>bVal - aVal;

    return ascending
      ? aVal.localeCompare(<string>bVal)
      : (<string>bVal).localeCompare(aVal);
  };
