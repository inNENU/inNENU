import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import { showNotice } from "../../../../utils/index.js";
import type {
  UnderAdmissionOptions,
  UnderAdmissionResponse,
} from "../../service/index.js";
import { getUnderAdmission } from "../../service/index.js";
import { validateIdCard } from "../../utils/index.js";

interface InputConfig {
  id: string;
  text: string;
  placeholder: string;
  type: string;
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
    theme: info.theme,

    /** 输入列表 */
    input: INPUT_CONFIG,

    detail: null as { title: string; content: string } | null,

    /** 弹窗配置 */
    popupConfig: { title: "查询结果", cancel: false },

    /**  查询结果 */
    result: null as UnderAdmissionResponse | null,

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
    const admissionInfo = wx.getStorageSync<UnderAdmissionOptions | undefined>(
      "admission-info",
    );

    if (admissionInfo) this.state.input = admissionInfo;

    this.setData({ theme: info.theme, type });

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
    const query = this.createSelectorQuery();

    this.setData({ isTyping: true, keyboardHeight: event.detail.height });

    if (this.renderer === "skyline") {
      query
        .select(".admission-page")
        .node()
        .exec((res: [WechatMiniprogram.NodeCallbackResult]) => {
          (res[0].node as WechatMiniprogram.ScrollViewContext).scrollIntoView(
            `#${event.currentTarget.id}`,
            { alignment: "nearest", animated: true },
          );
        });
    }
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

    if (!input.name) {
      this.tip("未填写姓名");

      return;
    }

    if (!validateIdCard(input.id)) {
      this.tip("证件号不合法");

      return;
    }

    if (!input.testId) {
      this.tip("未填写准考证号");

      return;
    }

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
