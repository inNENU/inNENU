import { defineHopeConfig } from "oxc-config-hope/oxlint";

export default defineHopeConfig(
  {
    node: ["scripts/**/*.ts", "gulpfile.cjs"],
    ignore: [
      "app/service/auth/encrypt.js",
      "app/service/auth/encrypt.d.ts",
      "app/pkg/tool/components/recycle-view/",
    ],
    rules: {
      // we should allow anonymous functions as callbacks
      "func-names": "off",
      "new-cap": [
        "warn",
        {
          capIsNewExceptions: ["Behavior", "Component", "Page", "App"],
        },
      ],
      // we need console
      "no-console": "off",
      "no-warning-comments": "off",
      // short return is preferred
      "typescript/consistent-return": "off",
      // a lot of wx api use promisify results
      "typescript/no-floating-promises": "off",
      // we need assert in multiple places
      "typescript/no-non-null-assertion": "off",
      // we do not guarantee the compatibility of env
      "typescript/prefer-nullish-coalescing": "off",
      // we should avoid this
      "typescript/strict-boolean-expressions": "off",
      // for component instance, we shall bind method functions in created
      "typescript/unbound-method": "off",
      // we do not guarantee the compatibility of env
      "unicorn/prefer-string-replace-all": "off",

      "no-map-spread": "off",
      "no-shadow": "off",
      "promise/catch-or-return": "off",
    },
  },
  {
    files: ["**/components/**/*.ts"],
    rules: {
      "typescript/unbound-method": "off",
    },
  },
  {
    files: ["**/base/**/*.ts", "**/components/**/*.ts", "**/pages/**/*.ts"],
    rules: {
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },
  {
    files: ["typings/**/*.d.ts"],
    rules: {
      "id-length": "off",
    },
  },
);
