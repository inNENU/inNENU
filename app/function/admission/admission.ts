import { $Page } from "@mptool/enhance";

import { appCoverPrefix } from "../../utils/config.js";
import { popNotice } from "../../utils/page.js";
import { validateId } from "../utils/validate.js";

interface FetchResult {
  /** cookies */
  cookies: unknown[];
  /** 填写信息 */
  info: string[];
  /** 验证码 */
  verifyCode: string;
  /** 通知 */
  notice: string;
  /** 详情 */
  detail: { title: string; content: string } | null;
}

interface SearchSuccessResult {
  status: "success";
  info: { text: string; value: string }[];
}

interface SearchErrorResult {
  status: "error";
  msg: string;
}

type SearchResult = SearchErrorResult | SearchSuccessResult;
interface InputConfig {
  id: string;
  text: string;
  placeholder: string;
  type: string;
}

const INPUT_CONFIG = <InputConfig[]>[
  { text: "姓名", type: "text", placeholder: "请输入姓名", id: "name" },
  { text: "身份证", type: "idcard", placeholder: "请输入身份证号", id: "id" },
  { text: "考生号", type: "digit", placeholder: "请输入考生号", id: "testId" },
];

$Page("admission", {
  data: {
    type: "debug",

    /** 层次选择器 */
    level: "本科生",

    /** 输入列表 */
    input: <InputConfig[]>[],

    /** 验证码 */
    verifyCode: "",

    /** 弹窗配置 */
    popupConfig: { title: "查询结果", cancel: false },

    /**  查询结果 */
    result: <SearchResult | null>null,

    /** 是否正在输入 */
    isTyping: false,
    /** 键盘高度 */
    keyboardHeight: 0,
  },

  state: {
    /** 表单信息 */
    info: <string[]>[],

    /** 输入信息 */
    input: <Record<string, string>>{},

    /** 验证码 */
    verifyCode: "",

    detail: <{ title: string; content: string } | null>null,

    /** Cookies */
    cookies: <unknown[]>[],
  },

  onLoad({ type = "debug" }) {
    const level =
      wx.getStorageSync<"本科生" | "研究生" | undefined>("level") || "本科生";
    const info = wx.getStorageSync<Record<string, string> | undefined>(
      "admission-info"
    );

    this.setData({
      firstPage: getCurrentPages().length === 1,
      type,
      level,
    });

    this.getInfo(level);

    if (info) this.state.input = info;

    // 设置通知
    popNotice("admission");
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: "录取查询",
      path: `/function/admission/admission?type=${this.data.type}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return { title: "录取查询", query: "type=${this.data.type}" };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: "录取查询",
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
    const query = wx.createSelectorQuery();

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

  inputVerifyCode({ detail }: WechatMiniprogram.Input) {
    this.state.verifyCode = detail.value;
  },

  blur() {
    this.setData({ isTyping: false });
  },

  getInfo(level: string) {
    wx.request<FetchResult>({
      method: "POST",
      url: "https://mp.innenu.com/service/admission-notice.php",
      enableHttp2: true,
      data: { type: "fetch", level },
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          console.log("Get verify code sucess with:", data);

          const { cookies, info, verifyCode, notice, detail } = data;

          this.state.cookies = cookies;
          this.state.detail = detail;
          this.state.info = info;
          this.setData({
            verifyCode,
            input: info.map(
              (item) => INPUT_CONFIG.find(({ id }) => id === item)!
            ),
            notice,
          });
        }
      },
    });
  },

  changeVerifyCode() {
    this.getInfo(this.data.level);
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

    if (info.includes("id") && !validateId(input.id))
      return this.tip("证件号不合法");

    if (info.includes("testId") && !input.testId)
      return this.tip("未填写准考证号");

    wx.setStorageSync("admission-info", input);
    wx.request<SearchResult>({
      method: "POST",
      url: "https://mp.innenu.com/service/admission-notice.php",
      enableHttp2: true,
      data: {
        type: "search",
        level: this.data.level,
        cookies: this.state.cookies,
        ...this.state.input,
        verifyCode: this.state.verifyCode,
      },
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          console.log("Get verify code sucess with:", data);

          this.setData({ result: data });
        }
      },
    });
  },

  showDetail() {
    const { detail } = this.state;

    if (detail) wx.showModal({ ...detail, showCancel: false });
  },

  closePopup() {
    this.setData({ result: null });
  },
});
