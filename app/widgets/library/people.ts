import { getLibraryPeople } from "../../service/library/people.js";

Component({
  lifetimes: {
    attached() {
      getLibraryPeople().then((people) => {
        this.setData(people);
      });
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});
