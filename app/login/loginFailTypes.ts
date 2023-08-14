export const enum LoginFailType {
  /** 账户锁定 */
  AccountLocked = "locked",
  /** 账号密码错误 */
  WrongCaptcha = "wrong-captcha",
  /** 账号密码错误 */
  WrongPassword = "wrong-password",
  /** 登陆过期 */
  Expired = "expired",
  /** 验证码 */
  NeedCaptcha = "need-captcha",
  /** 无权限 */
  Forbidden = "forbidden",
  /** 单点登录 */
  EnabledSSO = "sso",
  /** 未知错误 */
  Unknown = "unknown",
}
