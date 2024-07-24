import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";
import { showNotice } from "../../../../utils/index.js";
import type { UnderAdmissionOptions } from "../../service/index.js";
import { getUnderAdmission } from "../../service/index.js";
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
const PAGE_TITLE = "高考录取查询";

$Page(PAGE_ID, {
  data: {
    type: "debug",
    title: PAGE_TITLE,

    /** 输入列表 */
    input: INPUT_CONFIG,

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
    /** 输入信息 */
    input: {} as UnderAdmissionOptions,
  },

  onLoad({ type = "debug" }) {
    const info = wx.getStorageSync<UnderAdmissionOptions | undefined>(
      "admission-info",
    );

    if (info) this.state.input = info;

    this.setData({ type });

    // 设置通知
    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: PAGE_TITLE,
      path: `/pkg/tool/pages/admission/admission?type=${this.data.type}`,
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
    this.state.input[currentTarget.id as keyof UnderAdmissionOptions] =
      detail.value;
  },

  blur() {
    this.setData({ isTyping: false });
  },

  tip(title: string) {
    wx.showToast({
      title,
      duration: 2500,
      image: "/icon/close.png",
    });
  },

  async search() {
    const { input } = this.state;

    if (!input.name) return this.tip("未填写姓名");

    if (!validateIdCard(input.id)) return this.tip("证件号不合法");

    if (!input.testId) return this.tip("未填写准考证号");

    wx.setStorageSync("admission-info", input);

    wx.showLoading({ title: "查询中" });

    const result = await getUnderAdmission(input);

    wx.hideLoading();

    this.setData({ result });
  },

  closePopup() {
    this.setData({ result: null });
  },
});
