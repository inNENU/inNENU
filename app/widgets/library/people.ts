import { getLibraryPeople } from "./getPeople.js";

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
