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
  confirm?: string | false;
}
