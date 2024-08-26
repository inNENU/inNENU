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
  /** 需要二次认证 */
  NeedReAuth = "need-re-auth",
  /** 过于频繁 */
  TooFrequent = "too-frequent",
  /** 安全问题 */
  SecurityError = "security-error",

  /** 验证码错误 */
  WrongCaptcha = "wrong-captcha",
  /** 账号密码错误 */
  WrongPassword = "wrong-password",
  /** 信息错误 */
  WrongInfo = "wrong-info",
  /** 用户名错误 */
  WrongUserName = "wrong-username",

  /** 登录过期 */
  Expired = "expired",

  /** 直接访问受限，需要 webVPN */
  Restricted = "restricted",
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
  /** 数据库错误 */
  DatabaseError = "database-error",

  /** 未完成评教 */
  MissingCommentary = "missing-commentary",
  /** 人数已满 */
  Full = "full",

  /** 未知错误 */
  Unknown = "unknown",
}
