import { readFile } from "@mptool/all";

import { server } from "../config/index.js";

export const getPath = (path = ""): string =>
  path.startsWith("$") ? `${server}${path.slice(1)}` : path;
export const getIcon = (icon = ""): string =>
  !icon.includes(".") && !/^https?:\/\//.test(icon)
    ? readFile(`icon/${icon}`) || ""
    : getPath(icon);
