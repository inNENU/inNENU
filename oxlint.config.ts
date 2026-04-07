import { defineHopeConfig } from "oxc-config-hope/oxlint";

export default defineHopeConfig(
  {
    ignorePatterns: [
      "app/service/auth/encrypt.js",
      "app/service/auth/encrypt.d.ts",
      "app/pkg/tool/components/recycle-view/",
    ],
    rules: {
      "func-names": "off",
      "typescript/no-floating-promises": "off",
      "typescript/prefer-nullish-coalescing": "off",
      "typescript/strict-boolean-expressions": "off",
      "typescript/unbound-method": "off",
    },
  },
  {
    files: ["components/**/*.ts"],
    rules: {
      "typescript/unbound-method": "off",
    },
  },
);
