import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

$Component({
  props: {
    words: {
      type: Array as PropType<string[]>,
      default: [],
    },
    placeholder: {
      type: String,
      default: "搜索",
    },
    searchWord: {
      type: String,
      default: "",
    },
  },

  data: {
    /** 是否展示输入框 */
    showInput: false,
    /** 输入框是否获得焦点 */
    focus: false,
    /** 输入框中的值 */
    value: "",
  },

  methods: {
    showInput(): void {
      this.setData({ showInput: true, focus: true });
    },

    focus(): void {
      this.setData({ focus: true });
    },

    blur(): void {
      this.setData({ focus: false });
    },

    hideInput(): void {
      this.setData({ value: "", showInput: false });
    },

    clearInput(): void {
      this.setData({ value: "", focus: false });
    },

    onInputChange(event: WechatMiniprogram.Input): void {
      this.setData({ value: event.detail.value });
      this.triggerEvent("searching", { value: event.detail.value });
    },

    select(
      event: WechatMiniprogram.TouchEvent<
        Record<string, never>,
        Record<string, never>,
        { index: number }
      >,
    ): void {
      const value = this.data.words[event.currentTarget.dataset.index];

      this.setData({ value, words: [], focus: false });
      this.triggerEvent("search", { value });
    },

    confirm(event: WechatMiniprogram.Input): void {
      this.setData({ words: [], focus: false });
      this.triggerEvent("search", { value: event.detail.value });
    },
  },

  observers: {
    searchWord(value: string): void {
      this.setData({ value, showInput: true });
    },
  },

  externalClasses: ["custom-class"],
});
