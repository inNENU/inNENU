import { getLibraryPeople } from "./getPeople.js";

Component({
  lifetimes: {
    attached() {
      getLibraryPeople().then((people) => {
        this.setData(people);
      });
    },
  },

  externalClasses: ["custom-wrapper"],

  options: {
    virtualHost: true,
  },
});
