import { AUTH_SERVER } from "../../../../service/index.js";

export const AUTH_CAPTCHA_URL = `${AUTH_SERVER}/authserver/common/openSliderCaptcha.htl`;
export const AUTH_LOGIN_URL = `${AUTH_SERVER}/authserver/login`;
export const RE_AUTH_URL = `${AUTH_SERVER}/authserver/reAuthCheck/reAuthLoginView.do?isMultifactor=true`;
export const RESET_PREFIX = `${AUTH_SERVER}/retrieve-password`;
export const IMPROVE_INFO_URL = `${AUTH_SERVER}/authserver/improveInfo/improveUserInfo.do`;
export const UPDATE_INFO_URL = `${AUTH_SERVER}/authserver/improveInfo/updateUserInfo.do`;
export const RESET_SALT = "rjBFAaHsNkKAhpoi";
