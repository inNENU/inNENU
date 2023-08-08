export const enum LoginFailType {
  /** 账户锁定 */
  AccountLocked = "locked",
  /** 账号密码错误 */
  WrongCaptcha = "wrong-captcha",
  /** 账号密码错误 */
  WrongPassword = "wrong-password",
  /** 验证码 */
  NeedCaptcha = "need-captcha",
  /** 单点登录 */
  EnabledSSO = "sso",
  /** 未知错误 */
  Unknown = "unknown",
}
