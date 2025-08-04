import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type {
  ButtonListComponentItemConfig,
  FunctionalListComponentConfig,
  FunctionalListComponentItemOptions,
  PickerListComponentItemConfig,
  SliderListComponentItemConfig,
  SwitchListComponentItemConfig,
} from "../../../typings/index.js";
import { info } from "../../state/index.js";
import { getIconLink, route } from "../../utils/index.js";

interface ListDetail<T = FunctionalListComponentItemOptions> {
  id: string;
  item: T;
}

$Component({
  props: {
    /** 组件配置 */
    config: {
      type: Object as PropType<FunctionalListComponentConfig>,
      required: true,
    },

    /** 引用标题 */
    referrer: {
      type: String,
      default: "",
    },

    /** 是否在大标题后 */
    afterTitle: Boolean,
  },

  methods: {
    onItemTap({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { item: FunctionalListComponentItemOptions }
    >) {
      const { referrer } = this.data;
      const { item } = currentTarget.dataset;

      route(item, referrer);
    },

    /** 按钮设置 */
    onButtonTap(
      event: WechatMiniprogram.TouchEvent<
        Record<string, never>,
        Record<string, never>,
        { id: string }
      >,
    ): void {
      const { item } = this.getDetail<ButtonListComponentItemConfig>(event);

      if (item.handler) this.$call(item.handler, event);
    },

    /** 控制选择器显隐 */
    onPickerTap(
      event: WechatMiniprogram.TouchEvent<
        Record<string, never>,
        Record<string, never>,
        { id: string }
      >,
    ): void {
      const { id, item } = this.getDetail<PickerListComponentItemConfig>(event);

      this.setData({ [`config.items[${id}].visible`]: !item.visible });
    },

    /** 控制选择器改变 */
    onPickerChange(
      event: WechatMiniprogram.PickerChange<
        Record<string, never>,
        { id: string }
      >,
    ): void {
      const { id, item } = this.getDetail<PickerListComponentItemConfig>(event);

      if (event.type === "change") {
        const { value } = event.detail;

        // 判断为多列选择器，遍历每一列更新页面数据、并存储选择器值
        if (Array.isArray(value)) {
          value.forEach((x: string | number, y: number) => {
            (item.value as unknown[])[y] = (item.select as unknown[][])[y][
              Number(x)
            ];
            (item.currentValue as number[])[y] = Number(x);
          });
          wx.setStorageSync(item.key, value.join("-"));

          // 判断为单列选择器，更新页面数据并存储选择器值
        } else {
          item.value = item.select[Number(value)];
          item.currentValue = Number(value);
          wx.setStorageSync(item.key, Number(value));
        }

        // 将选择器的变更响应到页面上
        this.setData({ [`config.items[${id}]`]: item }, () => {
          if (item.handler) this.$call(item.handler, value);
        });
      }
    },

    /** 开关改变 */
    onToggleSwitch(
      event: WechatMiniprogram.SwitchChange<
        Record<string, never>,
        { id: string }
      >,
    ): void {
      const { id, item } = this.getDetail<SwitchListComponentItemConfig>(event);

      // 更新页面数据
      this.setData(
        { [`config.items[${id}].status`]: event.detail.value },
        () => {
          if (item.handler) this.$call(item.handler, event.detail.value);
        },
      );

      // 将开关值写入存储的 key 变量中
      wx.setStorageSync(item.key, event.detail.value);
    },

    /** 控制滑块显隐 */
    onSliderTap(
      event: WechatMiniprogram.PickerChange<
        Record<string, never>,
        { id: string }
      >,
    ): void {
      const { id, item } = this.getDetail<SliderListComponentItemConfig>(event);

      // 更新页面数据
      this.setData({ [`config.items[${id}].visible`]: !item.visible });
    },

    /** 滑块改变 */
    sliderChange(
      event: WechatMiniprogram.SliderChange<
        Record<string, never>,
        { id: string }
      >,
    ): void {
      const { id, item } = this.getDetail<SliderListComponentItemConfig>(event);
      const { value } = event.detail;

      // 更新页面数据，并写入值到存储
      item.value = value;

      // 写入页面数据
      this.setData({ [`config.items[${id}].value`]: value }, () => {
        if (item.handler) this.$call(item.handler, value);
      });

      if (event.type === "change") wx.setStorageSync(item.key, value);
    },

    /** 获得选择器位置与内容 */
    getDetail<
      T extends
        FunctionalListComponentItemOptions = FunctionalListComponentItemOptions,
    >({
      currentTarget,
    }: WechatMiniprogram.CustomEvent<
      Record<string, unknown>,
      Record<string, unknown>,
      { id: string } & Record<string, unknown>
    >): ListDetail<T> {
      const id = currentTarget.id || currentTarget.dataset.id;

      return {
        id,
        item: this.data.config.items[Number(id)] as T,
      };
    },

    /** 设置图标 */
    setLogo(items?: FunctionalListComponentItemOptions[]) {
      this.setData({
        icons: (items || this.data.config.items || []).map(({ icon }) =>
          getIconLink(icon),
        ),
      });
    },
  },

  lifetimes: {
    created() {
      this.setLogo = this.setLogo.bind(this);
    },
    attached() {
      const { selectable } = info;

      this.setData({ selectable });
      this.$on("inited", this.setLogo);
    },

    detached() {
      this.$off("inited", this.setLogo);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.items"(value: FunctionalListComponentItemOptions[]): void {
      this.setLogo(value);
    },
  },
});
