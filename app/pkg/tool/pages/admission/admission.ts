import { $Page } from "@mptool/all";

import { showModal } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";
import { showNotice } from "../../../../utils/index.js";
import type { UnderAdmissionOptions } from "../../service/index.js";
import { getGradAdmission, getUnderAdmission } from "../../service/index.js";
import { validateIdCard } from "../../utils/index.js";

interface InputConfig {
  id: string;
  text: string;
  placeholder: string;
  type: string;
}

interface AdmissionResponse {
  success: true;
  info: { text: string; value: string }[];
}

const INPUT_CONFIG = [
  { text: "姓名", type: "text", placeholder: "请输入姓名", id: "name" },
  { text: "身份证", type: "idcard", placeholder: "请输入身份证号", id: "id" },
  { text: "考生号", type: "digit", placeholder: "请输入考生号", id: "testId" },
] as InputConfig[];

const PAGE_ID = "admission";
const PAGE_TITLE = "录取查询";

$Page(PAGE_ID, {
  data: {
    type: "debug",

    /** 层次选择器 */
    level: "本科生",

    /** 输入列表 */
    input: [] as InputConfig[],

    detail: null as { title: string; content: string } | null,

    /** 弹窗配置 */
    popupConfig: { title: "查询结果", cancel: false },

    /**  查询结果 */
    result: null as AdmissionResponse | CommonFailedResponse | null,

    /** 是否正在输入 */
    isTyping: false,
    /** 键盘高度 */
    keyboardHeight: 0,
  },

  state: {
    /** 表单信息 */
    info: [] as string[],

    /** 输入信息 */
    input: {} as Record<string, string>,
  },

  onLoad({ type = "debug" }) {
    const level =
      wx.getStorageSync<"本科生" | "研究生" | undefined>("level") || "本科生";
    const info = wx.getStorageSync<Record<string, string> | undefined>(
      "admission-info",
    );

    this.setData({
      type,
      level,
    });

    this.getInfo(level);

    if (info) this.state.input = info;

    // 设置通知
    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: PAGE_TITLE,
      path: `/pkg/user/pages/admission/admission?type=${this.data.type}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return { title: PAGE_TITLE, query: `type=${this.data.type}` };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: PAGE_TITLE,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${this.data.type}`,
    };
  },

  /** 层次切换 */
  levelChange({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { level: "本科生" | "研究生" }
  >) {
    const { level } = currentTarget.dataset;

    if (level !== this.data.level) {
      this.setData({ level });
      wx.setStorageSync("level", level);
      this.getInfo(level);
    }
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
    this.state.input[currentTarget.id] = detail.value;
  },

  blur() {
    this.setData({ isTyping: false });
  },

  getInfo(level: string) {
    wx.showLoading({ title: "获取中" });
    if (level === "本科生") {
      const info = ["name", "id", "testId"];

      this.state.info = info;

      this.setData(
        {
          input: info.map(
            (item) => INPUT_CONFIG.find(({ id }) => id === item)!,
          ),
          notice: "",
        },
        () => {
          wx.hideLoading();
        },
      );
    } else {
      const info = ["name", "id"];

      this.state.info = info;
      this.setData(
        {
          input: info.map(
            (item) => INPUT_CONFIG.find(({ id }) => id === item)!,
          ),
          notice: "考生姓名只需输入前三个汉字",
          detail: null,
        },
        () => {
          wx.hideLoading();
        },
      );
    }
  },

  tip(title: string) {
    wx.showToast({
      title,
      duration: 2500,
      image: "/icon/close.png",
    });
  },

  search() {
    const { info, input } = this.state;

    if (info.includes("name") && !input.name) return this.tip("未填写姓名");

    if (info.includes("id") && !validateIdCard(input.id))
      return this.tip("证件号不合法");

    if (info.includes("testId") && !input.testId)
      return this.tip("未填写准考证号");

    wx.setStorageSync("admission-info", input);

    if (this.data.level === "本科生")
      getUnderAdmission(input as unknown as UnderAdmissionOptions).then(
        (response) => {
          this.setData({ result: response });
        },
      );
    else
      getGradAdmission({ name: input.name, id: input.id }).then((response) => {
        this.setData({ result: response });
      });
  },

  showDetail() {
    const { detail } = this.data;

    if (detail) {
      const { title, content } = detail;

      showModal(title, content);
    }
  },

  closePopup() {
    this.setData({ result: null });
  },
});
