import { defineHopeConfig } from "oxc-config-hope/oxfmt";

export default defineHopeConfig({
  ignorePatterns: [
    ".temp/**",
    "app/pkg/tool/components/recycle-view/*.js",
    "app/service/auth/encrypt.js",
    "app/service/auth/encrypt.d.ts",
    "project.config.json",
    "project.private.config.json",
  ],
});
