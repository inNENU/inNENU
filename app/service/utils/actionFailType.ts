export const enum ActionFailType {
  /** 缺少登录凭据 */
  MissingCredential = "missing-credential",
  /** 缺少必要参数 */
  MissingArg = "missing-arg",
  /** 非法参数 */
  InvalidArg = "invalid-arg",
  /** 未初始化 */
  NotInitialized = "not-initialized",

  /** 黑名单 */
  BlackList = "blacklist",
  /** 单点登录 */
  EnabledSSO = "sso",

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

  /** 无权限 */
  Forbidden = "forbidden",
  /** 冲突 */
  Conflict = "conflict",
  /** 已存在 */
  Existed = "existed",

  /** 系统错误 */
  Error = "error",
  /** 系统关闭 */
  Closed = "closed",

  /** 未完成评教 */
  MissingCommentary = "missing-commentary",

  /** 未知错误 */
  Unknown = "unknown",
}
