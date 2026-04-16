export default {
  workspaces: true,
  upgrade: true,
  timeout: 360000,
  target: (name) => {
    if (name === "@types/node") return "minor";

    return "latest";
  },
};
