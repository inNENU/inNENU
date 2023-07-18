import type { RichTextNode } from "../../../typings/index.js";

export interface ActivateSuccessResponse {
  success: true;
}
export interface ActivateFailedResponse {
  success: false;
  msg: string;
}

export interface ActivateImageResponse {
  success: true;
  license: string | RichTextNode[];
  image: string;
}

export interface ActivateInfoOptions {
  type: "info";
  name: string;
  schoolID: string;
  idType:
    | "护照"
    | "身份证"
    | "港澳居民来往内地通行证"
    | "台湾居民来往大陆通行证"
    | "外国人永久居留身份证"
    | "港澳台居民居住证";
  id: string;
  captcha: string;
}

export interface ActivateInfoSuccessResponse {
  success: true;
  activationId: string;
}

export type ActivateInfoResponse =
  | ActivateInfoSuccessResponse
  | ActivateFailedResponse;

export interface ActivatePhoneSmsOptions {
  type: "sms";
  activationId: string;
  phone: string;
}

export type ActivatePhoneSmsResponse =
  | ActivateSuccessResponse
  | ActivateFailedResponse;

export interface ActivateBindPhoneOptions {
  type: "bind-phone";
  activationId: string;
  phone: string;
  code: string;
}

export interface ActivateBindPhoneConflictResponse {
  success: false;
  type: "conflict" | "wrong";
  msg: string;
}
export type ActivateBindPhoneResponse =
  | ActivateSuccessResponse
  | ActivateBindPhoneConflictResponse;

export interface ActivateReplacePhoneOptions {
  type: "replace-phone";
  activationId: string;
  phone: string;
  code: string;
}

export type ActivateReplacePhoneResponse =
  | ActivateSuccessResponse
  | ActivateFailedResponse;

export interface ActivatePasswordOptions {
  type: "password";
  activationId: string;
  password: string;
}

export type ActivatePasswordResponse =
  | ActivateSuccessResponse
  | ActivateFailedResponse;

export type ActivateOptions =
  | ActivateInfoOptions
  | ActivatePhoneSmsOptions
  | ActivateBindPhoneOptions
  | ActivateReplacePhoneOptions
  | ActivatePasswordOptions;
