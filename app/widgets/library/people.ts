import { logger } from "@mptool/all";

import { getLibraryPeople } from "../../service/index.js";

Component({
  lifetimes: {
    attached() {
      getLibraryPeople().then((result) => {
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
