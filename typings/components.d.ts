import {
  type AccountComponentOptions,
  type ActionComponentOptions,
  type AudioComponentOptions,
  type ButtonListComponentItemOptions,
  type CardComponentOptions,
  type CarouselComponentOptions,
  type DocComponentOptions,
  type FooterComponentOptions,
  type FunctionalListComponentOptions,
  type GridComponentItemOptions,
  type GridComponentOptions,
  type ImageComponentOptions,
  type ListComponentItemOptions,
  type ListComponentOptions,
  type LoadingComponentOptions,
  type NavigatorListComponentItemOptions,
  type PhoneComponentOptions,
  type PickerListComponentItemOptions,
  type SliderListComponentItemOptions,
  type SwitchListComponentItemOptions,
  type TextComponentOptions,
  type TitleComponentOptions,
  type VideoComponentOptions,
} from "../server/typings/index.js";

export interface GridComponentItemConfig extends GridComponentItemOptions {
  /** Base64 icon 路径 */
  base64Icon?: string;
}

export interface GridComponentConfig extends GridComponentOptions {
  items: GridComponentItemConfig[];
}

export interface ListComponentItemConfig extends ListComponentItemOptions {
  /** Base64 icon 路径 */
  base64Icon?: string;
}

export interface ListComponentConfig extends ListComponentOptions {
  items: ListComponentItemConfig[];
}

export interface SwitchListComponentItemConfig
  extends SwitchListComponentItemOptions {
  /** 开关状态 */
  status?: boolean;
}

export interface SliderListComponentItemConfig<T = unknown>
  extends SliderListComponentItemOptions {
  /** 滑块对应的值*/
  value?: T;
  /** 是否显示滑块 */
  visible?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PickerListComponentItemConfig<T = any>
  extends PickerListComponentItemOptions<T> {
  /** 是否显示选择器 */
  visible?: boolean;
  /** picker 选择器对应的键 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentValue?: T extends any[] ? number[] : number;
}

export interface ButtonListComponentItemConfig
  extends ButtonListComponentItemOptions {
  /**
   * 是否禁用按钮
   *
   * @default false
   */
  disabled?: boolean;
}

export type FunctionalListComponentItemConfig =
  | ListComponentItemOptions
  | NavigatorListComponentItemOptions
  | SwitchListComponentItemConfig
  | PickerListComponentItemConfig
  | SliderListComponentItemConfig
  | ButtonListComponentItemConfig;

export interface FunctionalListComponentConfig
  extends FunctionalListComponentOptions {
  /** 列表内容 */
  content: FunctionalListComponentItemConfig[];
}

export interface CommonComponentConfig {
  /**
   * 是否隐藏
   *
   * @default false
   */
  hidden?: boolean;
}

export type ComponentConfig = (
  | AccountComponentOptions
  | ActionComponentOptions
  | AudioComponentOptions
  | CardComponentOptions
  | CarouselComponentOptions
  | DocComponentOptions
  | FooterComponentOptions
  | FunctionalListComponentConfig
  | GridComponentConfig
  | ImageComponentOptions
  | ListComponentConfig
  | LoadingComponentOptions
  | PhoneComponentOptions
  | TextComponentOptions
  | TitleComponentOptions
  | VideoComponentOptions
) &
  CommonComponentConfig;
