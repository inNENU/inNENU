import { getLibraryPeople } from "./api.js";

Component({
  lifetimes: {
    attached() {
      getLibraryPeople().then((people) => {
        this.setData({ people });
      });
    },
  },

  externalClasses: ["custom-class"],
});
