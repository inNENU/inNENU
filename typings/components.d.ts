import type {
  AccountComponentOptions,
  ActionComponentOptions,
  AudioComponentOptions,
  ButtonListComponentItemOptions,
  CardComponentOptions,
  CarouselComponentOptions,
  DocComponentOptions,
  FooterComponentOptions,
  FunctionalListComponentOptions,
  GridComponentOptions,
  ImageComponentOptions,
  ListComponentItemOptions,
  ListComponentOptions,
  NavigatorListComponentItemOptions,
  PhoneComponentOptions,
  PickerListComponentItemOptions,
  SliderListComponentItemOptions,
  SwitchListComponentItemOptions,
  TextComponentOptions,
  TitleComponentOptions,
  VideoComponentOptions,
} from "../server/typings/index.js";

export interface TextComponentConfig extends TextComponentOptions {
  /** 跳转路径 */
  url?: string;
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
  | GridComponentOptions
  | ImageComponentOptions
  | ListComponentOptions
  | PhoneComponentOptions
  | TextComponentConfig
  | TitleComponentOptions
  | VideoComponentOptions
) &
  CommonComponentConfig;
