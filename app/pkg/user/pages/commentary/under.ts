import { $Page, confirm, showModal } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { envName, info, user } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type {
  UnderCourseCommentaryInfo,
  UnderCourseCommentaryItem,
  UnderCourseCommentaryScoreItem,
} from "../../service/index.js";
import { underStudyCourseCommentary } from "../../service/index.js";

const PAGE_ID = "under-commentary";
const PAGE_TITLE = "课程评价";

const getTimes = (grade: number): { times: string[]; current: string } => {
  const date = new Date();

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;
  const times: string[] = [];

  for (let i = grade; i < currentYear; i++) times.push(`${i}01`, `${i}02`);

  times.push(`${currentYear}01`);
  if (currentMonth > 7) times.push(`${currentYear}02`);

  return {
    times: times.reverse(),
    current:
      currentMonth >= 2 && currentMonth < 8
        ? `${currentYear - 1}02`
        : `${currentYear}01`,
  };
};

const getDisplayTime = (time: string): string => {
  const year = Number(time.substring(0, 4));
  const isFirstTerm = time.substring(4) === "01";

  return `${isFirstTerm ? year : year + 1}年${isFirstTerm ? "秋季" : "春季"}`;
};

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,
    desc: "数据来自教务处教学服务系统",
    popupConfig: {
      title: "评价详情",
      cancel: false,
    },

    // 时间选择
    times: [] as string[],
    timeIndex: 0,
    timeDisplays: [] as string[],

    // 课程列表
    list: [] as UnderCourseCommentaryItem[],

    commentaryDetail: [] as UnderCourseCommentaryScoreItem[],

    // 输入选项
    questions: [] as UnderCourseCommentaryInfo["questions"],
    text: {} as UnderCourseCommentaryInfo["text"],

    // 用户输入
    answers: [] as number[],
    commentary: "",

    needLogin: false,
  },

  state: {
    inited: false,
    params: {} as Record<string, string>,
  },

  onLoad() {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
    });
  },

  onShow() {
    const { account, info } = user;

    if (account) {
      if (!info) {
        return showModal(
          "个人信息缺失",
          `${envName}本地暂无个人信息，请重新登录`,
          () => {
            this.$go("account-login?update=true");
          },
        );
      }

      if (!this.state.inited || this.data.needLogin) {
        if (info.typeId !== "bks")
          return showModal("暂不支持", "课程评价仅支持本科生", () => {
            this.$back();
          });

        const grade = Math.floor(account.id / 1000000);
        const { times, current } = getTimes(grade);
        const timeDisplays = times.map(getDisplayTime);

        this.setData({
          times,
          timeIndex: times.indexOf(current),
          timeDisplays,
        });

        this.getCourseCommentaryList(current);
      }
    }

    this.setData({ needLogin: !user.account });

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getCourseCommentaryList(time: string) {
    wx.showLoading({ title: "获取中" });

    const result = await underStudyCourseCommentary({
      type: "list",
      time,
    });

    wx.hideLoading();
    this.state.inited = true;

    if (!result.success) {
      return showModal("获取失败", result.msg);
    }

    this.setData({
      list: result.data,
      canCommentAll: result.data.some(({ commentaryCode }) => !commentaryCode),
    });
  },

  onTimeChange({ detail }: WechatMiniprogram.PickerChange) {
    const timeIndex = Number(detail.value);
    const { times, timeIndex: timeOldIndex } = this.data;

    if (timeIndex !== timeOldIndex) {
      const newTime = times[timeIndex];

      this.setData({ timeIndex, commentaryDetail: [] });
      this.getCourseCommentaryList(newTime);
    }
  },

  refresh() {
    const { timeIndex, times } = this.data;

    this.getCourseCommentaryList(times[timeIndex]);
  },

  async viewCourseCommentary({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { commentaryCode: string }
  >) {
    const { commentaryCode } = currentTarget.dataset;

    const result = await underStudyCourseCommentary({
      type: "view",
      commentaryCode,
    });

    if (result.success) {
      this.setData({
        commentaryDetail: result.data,
        totalScore: result.data.reduce((total, { score }) => total + score, 0),
      });
    } else {
      showModal("查看失败", result.msg);
    }
  },

  closeScoreDetail() {
    this.setData({ commentaryDetail: [] });
  },

  async startCourseCommentary({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { teacherCode: string; courseCode: string }
  >) {
    const { teacherCode, courseCode } = currentTarget.dataset;

    const result = await underStudyCourseCommentary({
      type: "get",
      courseCode,
      teacherCode,
    });

    if (result.success) {
      const { params, text, questions } = result.data;

      this.state.params = params;

      this.setData({
        questions,
        text,
      });
    } else {
      showModal("获取失败", result.msg);
    }
  },

  closeForm() {
    this.setData({ questions: [], answers: [], commentary: "" });
  },

  onRadioChange({
    detail,
    target,
  }: WechatMiniprogram.RadioGroupChange<
    Record<string, never>,
    { questionIndex: number }
  >) {
    const { value } = detail;
    const newAnswers = [...this.data.answers];

    newAnswers[target.dataset.questionIndex] = Number(value);

    this.setData({ answers: newAnswers });
  },

  onCommentaryInput({ detail }: WechatMiniprogram.TextareaInput) {
    this.setData({ commentary: detail.value });
  },

  async submitCourseCommentary() {
    const { questions, text, commentary, answers } = this.data;
    const { params } = this.state;

    if (
      questions.some((_question, index) => typeof answers[index] !== "number")
    ) {
      showModal("提交失败", "请完成所有评分项");

      return;
    }

    const result = await underStudyCourseCommentary({
      type: "submit",
      params,
      questions,
      text: text,
      answers,
      commentary,
    });

    if (result.success) {
      showModal("提交成功", "感谢您的评价", () => {
        this.refresh();
      });
    } else {
      showModal("提交失败", result.msg);
    }
  },

  commentAll() {
    const { list } = this.data;

    confirm("一键评教", "此操作将一键评价所有未评价的课程为 100 分。", () =>
      Promise.all(
        list.map(async ({ teacherCode, courseCode }) => {
          const getResult = await underStudyCourseCommentary({
            type: "get",
            courseCode,
            teacherCode,
          });

          if (getResult.success) {
            const { params, text, questions } = getResult.data;

            const submitResult = await underStudyCourseCommentary({
              type: "submit",
              params,
              questions,
              text: text,
              answers: Array(questions.length).fill(0),
              commentary: "",
            });

            if (submitResult.success) {
              return true;
            }
          }

          return false;
        }),
      ).then((results) => {
        if (results.every(Boolean))
          showModal("一键评教成功", "已评价所有课程为 100 分。", () => {
            this.refresh();
          });
        else
          showModal(
            "一键评教失败",
            "部分课程评价失败，请尝试手动评价。",
            () => {
              this.refresh();
            },
          );
      }),
    );
  },
});
