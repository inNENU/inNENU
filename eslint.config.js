import {
  defaultNamingConventionRules,
  globals,
  hope,
} from "eslint-config-mister-hope";

export default hope(
  {
    ignores: [
      "app/service/auth/encrypt.js",
      "app/service/auth/encrypt.d.ts",
      "app/pkg/tool/components/recycle-view/",
      "res/**",
    ],

    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        project: "./tsconfig.json",
        extraFileExtensions: [".wxs"],
      },
    },

    ts: {
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "property",
          filter: {
            regex: "Content-Type",
            match: true,
          },
          format: null,
        },
        ...defaultNamingConventionRules,
      ],
    },

    wxapp: true,
  },

  {
    files: ["app/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      // $this.on this.off can not bind $this
      "@typescript-eslint/unbound-method": "off",
    },
  },

  {
    files: ["gulpfile.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
