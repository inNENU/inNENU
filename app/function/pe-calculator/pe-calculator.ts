import { $Page } from "@mptool/enhance";

import { modal } from "../../utils/api.js";
import { appCoverPrefix } from "../../utils/config.js";
import { getJSON } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

/** 分数段设置 */
const gradeLevels = [
  10, 20, 30, 40, 50, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 85, 90, 95,
  100,
];
/** 特殊项目 */
const special = [
  { text: "引体向上", unit: "个", type: "number", id: "chinning" },
  { text: "仰卧起坐", unit: "个", type: "number", id: "situp" },
];
/** 长跑文字 */
const longRunText = ["1000米跑", "800米跑"];
/** 长跑选择器内容 */
const longRunPicker = [["2分", "3分", "4分", "5分", "6分", "7分"], []];

// 生成长跑选择器
for (let i = 0; i < 60; i += 1) longRunPicker[1].push(`${i}秒`);

interface GradeConfig {
  /** 肺活量 */
  vitalCapacity: number[];
  /** 短跑 */
  shortRun: number[];
  /** 坐位体前屈 */
  sitAndReach: number[];
  /** 立定跳远 */
  standingLongJump: number[];
  /** 长跑 */
  longRun: number[];
  /** 仰卧起坐 */
  situp?: number[];
  /** 立定跳远 */
  chinning?: (number | string)[];
}

interface PEScore {
  /** BMI 分值 */
  bmi: number;
  /** 肺活量分值 */
  vitalCapacity: number;
  /** 仰卧起坐分值 */
  sitAndReach: number;
  /** 立定跳远分值 */
  standingLongJump: number;
  /** 短跑分值 */
  shortRun: number;
  /** 长跑分值 */
  longRun: number;
  /** 特殊项目分值 */
  special: number;
  /** 及格分值 */
  passScore: number;
}

$Page("pe-calculator", {
  data: {
    /** 性别选择器 */
    gender: {
      keys: ["男", "女"],
      key: "",
      values: ["male", "female"],
    },

    /** 年级选择器 */
    grade: {
      keys: ["大一", "大二", "大三", "大四"],
      key: "",
      values: ["low", "low", "high", "high"],
    },

    /** 输入列表 */
    list: [
      { text: "身高", unit: "厘米", type: "digit", id: "height" },
      { text: "体重", unit: "千克", type: "digit", id: "weight" },
      { text: "坐位体前屈", unit: "厘米", type: "digit", id: "sitAndReach" },
      { text: "肺活量", unit: "毫升", type: "number", id: "vitalCapacity" },
      { text: "立定跳远", unit: "米", type: "digit", id: "standingLongJump" },
      { text: "50米跑", unit: "秒", type: "digit", id: "shortRun" },
    ],

    /** 长跑文字 */
    longRun: { text: "800米跑" },

    /** 特殊项目文字 */
    special: { text: "仰卧起坐", unit: "个", id: "situp" },

    /** 体育成绩 */
    peScore: {},

    /** 弹窗配置 */
    popupConfig: { title: "体测成绩", cancel: false },

    /** 成绩表 */
    scoreList: [
      { text: "BMI", id: "bmi" },
      { text: "坐位体前屈", id: "sitAndReach" },
      { text: "肺活量", id: "vitalCapacity" },
      { text: "立定跳远", id: "standingLongJump" },
      { text: "50米跑", id: "shortRun" },
    ],

    /** 是否正在输入 */
    isTyping: false,
    /** 键盘高度 */
    keyboardHeight: 0,
  },

  state: {
    /** 测试成绩 */
    result: <Record<string, number>>{},
    /** 性别 */
    gender: "",
    /** 年级 */
    grade: "",
  },

  onLoad() {
    const genderIndex = wx.getStorageSync<number | undefined>("gender");
    const gradeIndex = wx.getStorageSync<number | undefined>("grade");
    const genderKeys = this.data.gender.keys;
    const gradeKeys = this.data.grade.keys;

    this.setData({
      firstPage: getCurrentPages().length === 1,

      // 写入性别
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "gender.key":
        typeof genderIndex === "number" ? genderKeys[genderIndex] : "",

      // 写入年级
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "grade.key": typeof gradeIndex === "number" ? gradeKeys[gradeIndex] : "",

      // 改变特别项目和长跑的名称
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "longRun.text": longRunText[genderIndex || 0],
      special: special[genderIndex || 0],
      // 设置长跑选择器数据
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "longRun.picker": longRunPicker,
    });

    if (typeof genderIndex === "number")
      this.state.gender = this.data.gender.values[genderIndex];

    if (typeof gradeIndex === "number")
      this.state.grade = this.data.grade.values[gradeIndex];

    // 设置通知
    popNotice("pe-calculator");
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: "体测计算器",
    path: "/function/pe-calculator/pe-calculator",
  }),

  onShareTimeline: () => ({ title: "体测计算器" }),

  onAddToFavorites: () => ({
    title: "体测计算器",
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  /** 性别切换 */
  genderChange({ detail }: WechatMiniprogram.PickerChange) {
    const index = Number(detail.value);

    // 改变特别项目和长跑的名称
    this.setData({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "gender.key": this.data.gender.keys[index],
      special: special[index],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "longRun.text": longRunText[index],
    });
    this.state.gender = this.data.gender.values[index];
    wx.setStorageSync("gender", index);
  },

  /** 年级切换 */
  gradeChange({ detail }: WechatMiniprogram.PickerChange) {
    const index = Number(detail.value);

    // 设置年级
    this.setData({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "grade.key": this.data.grade.keys[index],
    });
    this.state.grade = this.data.grade.values[index];
    wx.setStorageSync("grade", index);
  },

  /** 输入框聚焦 */
  focus(event: WechatMiniprogram.InputFocus) {
    const { id } = event.currentTarget;
    const query = this.createSelectorQuery();

    this.setData({ isTyping: true, keyboardHeight: event.detail.height });

    query.select(`#${id}`).boundingClientRect();
    query.selectViewport().fields({ size: true, scrollOffset: true });
    query.exec((res: Required<WechatMiniprogram.NodeInfo>[]) => {
      if (res[0].bottom + event.detail.height > res[1].height)
        wx.pageScrollTo({
          scrollTop:
            res[1].scrollTop +
            res[0].bottom +
            event.detail.height -
            res[1].height +
            10,
        });
    });
  },

  /** 输入成绩 */
  input({ currentTarget, detail }: WechatMiniprogram.Input) {
    this.state.result[currentTarget.id] = Number(detail.value);
  },

  blur() {
    this.setData({ isTyping: false });
  },

  /** 长跑选择器设置 */
  longRunHandler({ detail }: WechatMiniprogram.PickerChange) {
    const value = detail.value as number[];

    // 设置显示数据
    this.setData({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "longRun.value": `${longRunPicker[0][value[0]]} ${
        longRunPicker[1][value[1]]
      }`,
    });
    this.state.result.longRun = (value[0] + 2) * 60 + value[1];
  },

  /** 计算 BMI */
  getBMI(result: Record<string, number>): [number, number] {
    const bmiResult =
      Math.round((result.weight * 100000) / result.height / result.height) / 10;

    // 计算 BMI 状态与分值
    const [state, bmi] =
      this.state.gender === "male"
        ? bmiResult <= 17.8
          ? ["低体重", 80]
          : bmiResult >= 28
          ? ["肥胖", 60]
          : bmiResult >= 24
          ? ["超重", 80]
          : ["正常", 100]
        : bmiResult <= 17.1
        ? ["低体重", 80]
        : bmiResult >= 28
        ? ["肥胖", 60]
        : bmiResult >= 24
        ? ["超重", 80]
        : ["正常", 100];

    // 计算及格分数
    const passScore =
      this.state.grade === "low"
        ? 60 - Math.ceil(Math.max(bmiResult - 28, 0)) * 2
        : 50 - Math.ceil(Math.max(bmiResult - 28, 0)) * 2;

    this.setData({ bmi: { score: bmiResult, state } });

    return [bmi, passScore];
  },

  /** 获得最终成绩 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getResult(result: Record<string, any>, callback: (peScore: PEScore) => void) {
    const { length } = gradeLevels;
    const { gender, grade } = this.state;
    const peScore: PEScore = {
      bmi: 0,
      vitalCapacity: 0,
      sitAndReach: 0,
      standingLongJump: 0,
      shortRun: 0,
      longRun: 0,
      special: 0,
      passScore: 60,
    };

    // 校验数据的合法性
    if (result.height < 2) {
      modal("请输入正确的身高", "身高的单位是厘米");

      return;
    }

    // 可以计算 BMI
    if (result.height && result.weight)
      [peScore.bmi, peScore.passScore] = this.getBMI(result);

    // 读取相应配置文件
    getJSON<GradeConfig>(`function/pe-calculator/${gender}-${grade}`).then(
      (config) => {
        // 以下三项越高越好，进行计算
        (<("vitalCapacity" | "sitAndReach" | "standingLongJump")[]>[
          "vitalCapacity",
          "sitAndReach",
          "standingLongJump",
        ]).forEach((x) => {
          if (result[x] && Number(result[x])) {
            for (let i = length; i >= 0; i -= 1)
              if (result[x] >= config[x][i]) {
                peScore[x] = gradeLevels[i];
                break;
              } else if (i === 0) {
                peScore[x] = 0;
              }
          } else {
            peScore[x] = 0;
          }
        });

        // 以下两项越低越好
        (<("shortRun" | "longRun")[]>["shortRun", "longRun"]).forEach((x) => {
          if (result[x]) {
            for (let i = length; i >= 0; i -= 1)
              if (result[x] <= config[x][i]) {
                peScore[x] = gradeLevels[i];
                break;
              } else if (i === 0) {
                peScore[x] = 0;
              }
          } else {
            peScore[x] = 0;
          }
        });

        // 计算特别类项目分数
        const specialScore = gender === "male" ? "chinning" : "situp";

        if (result[specialScore] && Number(result[specialScore])) {
          for (let i = length; i >= 0; i -= 1)
            if (
              config[specialScore]![i] !== "" &&
              result[specialScore] >= config[specialScore]![i]
            ) {
              peScore.special = gradeLevels[i];
              break;
            } else if (i === 0) {
              peScore.special = 0;
            }
        } else {
          peScore.special = 0;
        }

        // TODO: 计算加分
        console.info("Score:", peScore);

        callback(peScore);
      }
    );
  },

  /** 计算最终结果 */
  calculate() {
    const { result } = this.state;
    const { gender, grade } = this.state;

    wx.showLoading({ title: "计算中...", mask: true });
    console.info("Input data: ", result);

    // 可以计算
    if (gender && grade) {
      this.getResult(result, (peScore) => {
        // 计算最终成绩
        const finalScore =
          Math.round(
            peScore.vitalCapacity * 15 +
              peScore.shortRun * 20 +
              peScore.sitAndReach * 10 +
              peScore.standingLongJump * 10 +
              peScore.special * 10 +
              peScore.longRun * 20 +
              peScore.bmi * 15
          ) / 100;

        this.setData({
          peScore,
          showScore: true,
          pe: {
            score: finalScore,
            state: finalScore >= peScore.passScore ? "及格" : "不及格",
          },
        });
      });

      wx.hideLoading();
    } else {
      wx.hideLoading();
      wx.showToast({
        title: "请选择性别年级",
        duration: 2500,
        image: "/icon/close.png",
      });
    }
  },

  close() {
    this.setData({ showScore: false });
  },
});
