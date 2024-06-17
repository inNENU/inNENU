export const enum ActionFailType {
  /** 账户锁定 */
  AccountLocked = "locked",

  /** 验证码 */
  NeedCaptcha = "need-captcha",

  /** 验证码错误 */
  WrongCaptcha = "wrong-captcha",
  /** 账号密码错误 */
  WrongPassword = "wrong-password",
  /** 手机号错误 */
  WrongCellphone = "wrong-cellphone",
  /** 用户名错误 */
  WrongUserName = "wrong-username",

  /** 登陆过期 */
  Expired = "expired",
  /** 冲突 */
  Conflict = "conflict",
  /** 已存在 */
  Existed = "existed",

  /** 无权限 */
  Forbidden = "forbidden",
  /** 单点登录 */
  EnabledSSO = "sso",
  /** 未知错误 */
  Unknown = "unknown",
  /** 黑名单 */
  BlackList = "blacklist",
  /** 系统关闭 */
  Closed = "closed",

  /** 未初始化 */
  NotInitialized = "not-initialized",
}
