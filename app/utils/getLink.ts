import { readFile } from "@mptool/all";

import { server } from "../config/index.js";

export const getAssetLink = (path = ""): string =>
  path.startsWith("$") ? `${server}${path.slice(1)}` : path;

export const getIconLink = (icon = ""): string =>
  icon
    ? !icon.includes(".") && !/^https?:\/\//.test(icon)
      ? readFile(`icon/${icon}`) || ""
      : getAssetLink(icon)
    : "";
