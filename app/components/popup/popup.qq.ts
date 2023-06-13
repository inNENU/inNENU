import { getWindowInfo } from "../../utils/api.js";

export interface PopupConfig {
  /** 主标题 */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 文字 */
  text?: string;
  /** 描述 */
  desc?: string;
  /** 是否展示更多按钮 (默认: 否) */
  more?: boolean;
  /** 取消按钮文字，填入 `false` 不显示取消按钮，默认为 '取消 */
  cancel?: string | false;
  /** 确认按钮文字 (默认: '确认')*/
  confirm?: string;
}

Component({
  properties: {
    config: Object,
    // 是否展示对话框
    show: {
      type: Boolean,
      default: false,
    },
  },

  lifetimes: {
    attached() {
      this.updateLayout();
    },
  },

  pageLifetimes: {
    resize() {
      this.updateLayout();
    },
  },

  methods: {
    updateLayout() {
      const { windowHeight, safeArea } = getWindowInfo();

      // TODO: issues in qq where safeArea is not defined
      this.setData({
        paddingBottom: safeArea?.bottom
          ? Math.max(windowHeight - safeArea.bottom, 24)
          : 24,
      });
    },
    // 用户确认
    confirm(): void {
      this.triggerEvent("confirm");
    },
    // 用户取消
    cancel(): void {
      this.triggerEvent("cancel");
    },
    // 用户点击关闭按钮
    closeDialog(): void {
      this.triggerEvent("close");
    },
    // 用户点击更多按钮
    more(): void {
      this.triggerEvent("more");
    },
  },

  options: {
    styleIsolation: "apply-shared",
  },
});
