import type {
  AccountComponentOptions,
  ActionComponentOptions,
  AudioComponentOptions,
  ButtonListComponentItemOptions,
  CardComponentOptions,
  CarouselComponentData,
  DocComponentData,
  FooterComponentOptions,
  FunctionalListComponentOptions,
  GridComponentOptions,
  ImageComponentOptions,
  ListComponentItemOptions,
  ListComponentOptions,
  NavigatorListComponentItemOptions,
  PhoneComponentData,
  PickerListComponentItemOptions,
  SliderListComponentItemOptions,
  SwitchListComponentItemOptions,
  TextComponentData,
  TitleComponentData,
  VideoComponentOptions,
} from "innenu-generator/typings";

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

export interface PickerListComponentItemConfig
  extends PickerListComponentItemOptions {
  /** 是否显示选择器 */
  visible?: boolean;
  /** picker 选择器对应的键 */
  currentValue?: number[] | number;
  value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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

export interface CommonComponentData {
  /**
   * 是否隐藏
   *
   * @default false
   */
  hidden?: boolean;
}

export type ComponentData = (
  | AccountComponentOptions
  | ActionComponentOptions
  | AudioComponentOptions
  | CardComponentOptions
  | CarouselComponentData
  | DocComponentData
  | FooterComponentOptions
  | FunctionalListComponentConfig
  | GridComponentOptions
  | ImageComponentOptions
  | ListComponentOptions
  | PhoneComponentData
  | TextComponentData
  | TitleComponentData
  | VideoComponentOptions
) &
  CommonComponentData;
