import { logger } from "@mptool/all";

import type { AppOption } from "../../app.js";
import {
  getLibraryPeople,
  getOnlineLibraryPeople,
} from "../../service/index.js";

const { useOnlineService } = getApp<AppOption>();

Component({
  lifetimes: {
    attached() {
      (useOnlineService("library-people")
        ? getOnlineLibraryPeople
        : getLibraryPeople)().then((result) => {
        if (result.success) this.setData(result);
        else logger.error("图书馆人数获取失败");
      });
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});
