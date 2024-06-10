import type { PageConfig } from "../../typings/index.js";
import { requestJSON } from "../api/index.js";
import { LICENSE_KEY, PRIVACY_KEY } from "../config/index.js";
import { info } from "../state/index.js";

const localLicenseVersion = wx.getStorageSync<number | undefined>(LICENSE_KEY);
const localPrivacyVersion = wx.getStorageSync<number | undefined>(PRIVACY_KEY);

let onlineLicenseVersion: number | null = null;
let onlinePrivacyVersion: number | null = null;
let needLicense: boolean | null = null;
let needPrivacy: boolean | null = null;

export interface LicenseStatus {
  needAuthorize: boolean;
  version: number;
}

export const getLicenseStatus = (): Promise<LicenseStatus> => {
  if (onlineLicenseVersion)
    return Promise.resolve({
      needAuthorize: needLicense!,
      version: onlineLicenseVersion,
    });

  return requestJSON<PageConfig & { version: number }>(
    `d/config/${info.appID}/license-data`,
  ).then(({ version }) => {
    onlineLicenseVersion = version;
    needLicense = version !== localLicenseVersion;

    return {
      needAuthorize: needLicense,
      version,
    };
  });
};

export interface PrivacyStatus {
  needAuthorize: boolean;
  version?: number;
}

export const getPrivacyStatus = (): Promise<PrivacyStatus> => {
  if (typeof wx.getPrivacySetting === "function")
    return new Promise<PrivacyStatus>((resolve) => {
      wx.getPrivacySetting({
        success: ({ needAuthorization }) => {
          needPrivacy = needAuthorization;
          resolve({
            needAuthorize: needPrivacy,
          });
        },
      });
    });

  if (onlinePrivacyVersion)
    return Promise.resolve({
      needAuthorize: needPrivacy!,
      version: onlinePrivacyVersion,
    });

  return requestJSON<PageConfig & { version: number }>(
    `d/config/${info.appID}/privacy-data`,
  ).then(({ version }) => {
    onlinePrivacyVersion = version;
    needPrivacy = version !== localPrivacyVersion;

    return {
      needAuthorize: needPrivacy,
      version,
    };
  });
};

export const agreeLicense = (): void => {
  needLicense = false;
  wx.setStorageSync(LICENSE_KEY, onlineLicenseVersion!);
};

export const agreePrivacy = (): void => {
  needPrivacy = false;
  wx.setStorageSync(PRIVACY_KEY, onlinePrivacyVersion!);
};
