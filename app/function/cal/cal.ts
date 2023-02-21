import { $Page } from "@mptool/enhance";

import { type AppOption } from "../../app";
import { setPage } from "../../utils/page";

const { globalData } = getApp<AppOption>();

interface Grade {
  course: string;
  grade: string;
  credit: string;
  courseFocus?: boolean;
  creditFocus?: boolean;
  gradeFocus?: boolean;
}

$Page("cal", {
  data: {
    /** 头部配置 */
    nav: {
      title: "绩点计算(beta)",
      statusBarHeight: globalData.info.statusBarHeight,
      from: "功能大厅",
    },

    grade: <Grade[]>[],

    /** 总学分 */
    totalCredit: 0,

    theme: globalData.theme,

    /** 平均绩点 */
    gpa: 0,

    editText: "编辑",
    display: false,
  },

  onLoad(option) {
    setPage({ option, ctx: this });
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  /** 添加新的课程 */
  add() {
    // 向 grade 最后插入一个新元素
    const gradeNew = this.data.grade.concat({
      course: "",
      grade: "",
      credit: "null",
      courseFocus: false,
      gradeFocus: false,
      creditFocus: false,
    });

    // 对data赋值
    this.setData({ grade: gradeNew });
  },

  input(event: WechatMiniprogram.Input) {
    console.log(event);
    const { grade } = this.data;

    /*
     * 获取grade
     * console.log(Number(e.detail.value));
     */
    const index = event.currentTarget.dataset.index as number;
    const target = event.currentTarget.dataset.class as
      | "course"
      | "credit"
      | "grade";
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const targetFocus = `${target}Focus` as
      | "courseFocus"
      | "creditFocus"
      | "gradeFocus";

    if (event.detail.value.length < event.currentTarget.dataset.maxLength)
      grade[index][targetFocus] = true;
    else grade[index][targetFocus] = false;

    grade[index][target] = event.detail.value;

    console.log(grade);

    this.setData({ grade });
  },

  next(event: WechatMiniprogram.TouchEvent) {
    const { grade } = this.data;
    const index = event.currentTarget.dataset.index as number;

    grade[index].gradeFocus = true;
    this.setData({ grade });
  },

  edit() {
    const editText = this.data.display ? "编辑" : "完成";

    this.setData({
      display: !this.data.display,
      editText,
    });
  },

  sort(event: WechatMiniprogram.TouchEvent) {
    // TODO: 添加排序
    console.log(event);
  },

  /** 移除课程 */
  remove(event: WechatMiniprogram.TouchEvent) {
    console.log(event);
    const index = event.currentTarget.dataset.index as number;
    const { grade } = this.data;

    grade.splice(Number(index), 1);

    this.setData({ grade });
  },

  calculate() {
    const courseNumber = this.data.grade.length;

    // 获得课程数
    console.log(`课程数是${courseNumber}`);

    let totalCredit = 0;
    let totalGradeCal = 0;
    let flunkingCredit = 0;
    let flunkingGradeCal = 0;

    for (let i = 0; i < courseNumber; i++) {
      const grade = Number(this.data.grade[i].grade);
      const credit = Number(this.data.grade[i].credit);

      if (grade !== 0 && grade && credit)
        if (grade < 60) {
          /*
           * 判断grade和credit是否均有值
           * 单独列出不及格的学分和成绩,且只有大于50分绩点为正值才计算。
           */
          flunkingCredit = credit + flunkingCredit;
          if (grade > 50)
            flunkingGradeCal = ((grade - 50) / 10) * credit + flunkingGradeCal;
        } else {
          // 及格的学分和成绩
          totalCredit = credit + totalCredit;
          totalGradeCal = ((grade - 50) / 10) * credit + totalGradeCal;
        }
    }
    console.log(`总学分是${totalCredit}`);
    console.log(`总计算是${totalGradeCal}`);
    console.log(`挂科学分是${flunkingCredit}`);
    console.log(`总挂科计算是${flunkingGradeCal}`);
    if (Number(flunkingCredit) === 0) {
      console.log("都及格了");
      // 如果都及格什么也不做
      this.setData({
        totalCredit,
        gpa: totalGradeCal / totalCredit,
      });
      console.log(totalCredit);
      console.log(totalGradeCal / totalCredit);
      // 向data赋值计算结果
    } else {
      wx.showModal({
        // 弹窗让用户选择
        title: "请选择计算方式",
        content: "平均绩点是否包含未达到60的成绩?\n★为建议项",
        cancelText: "包含",
        cancelColor: "#ff0000",
        confirmText: "排除★",
        success: ({ confirm, cancel }) => {
          if (cancel) {
            // 包含不及格成绩
            totalCredit += flunkingCredit;
            totalGradeCal += flunkingGradeCal;
            // 写入不及格学分与成绩计算
            console.log("不及格学分成绩被计入");
            console.log(`新总学分是${totalCredit}`);
            console.log(`新总计算是${totalGradeCal}`);
          } else if (confirm) {
            console.log("都及格了");
          }

          /*
           * 不包含不及格成绩，什么都不做
           * console.log(totalCredit)
           * console.log(totalGradeCal / totalCredit)
           */
          // 向data赋值计算结果
          this.setData({
            totalCredit,
            gpa: totalGradeCal / totalCredit,
          });
        },
      });
    }
  },
});
