import hopeConfig, {
  config,
  globals,
  tsConfigs,
  tsParser,
} from "eslint-config-mister-hope";

export default config(
  ...hopeConfig,

  {
    ignores: [
      "**/node_modules/**",
      "app/function/utils/encoder.js",
      "app/function/utils/encoder.d.ts",
      "app/service/auth/encrypt.js",
      "app/service/auth/encrypt.d.ts",
      "dist/**",
      "server/**",
      "temp/**",
    ],
  },

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        parser: tsParser,
        tsconfigDirName: import.meta.dirname,
        project: "./tsconfig.json",
        extraFileExtensions: [".wxs"],
      },
    },
  },

  {
    files: ["app/**/*.ts"],
    languageOptions: {
      globals: {
        wx: "readonly",
        getApp: "readonly",
        getCurrentPages: "readonly",
        App: "readonly",
        Page: "readonly",
        Component: "readonly",
        getRegExp: "readonly",
      },
    },
  },

  {
    files: ["**/*.ts"],
    rules: {
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
        {
          selector: "default",
          format: ["camelCase"],
        },
        {
          selector: ["variable"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["parameter"],
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["property"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "import",
          format: ["PascalCase", "camelCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["PascalCase"],
        },
      ],

      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },

  {
    files: ["app/**/*.wxs"],
    ...tsConfigs.disableTypeChecked,
  },

  {
    files: ["app/**/*.wxs"],
    languageOptions: {
      ecmaVersion: 5,
      globals: {
        getDate: "readonly",
        getRegExp: "readonly",
        console: "readonly",
        module: "readonly",
      },
    },
    rules: {
      curly: ["error", "all"],
      "func-names": ["error", "never"],
      "func-style": ["error", "declaration"],
      "no-var": "off",
      "object-shorthand": ["error", "never"],
      "prefer-destructuring": "off",
      "prefer-template": "off",

      "@typescript-eslint/no-var-requires": "off",

      "import/no-commonjs": "off",
      "import/no-default-export": "off",
      "import/no-named-export": "off",
    },
  },

  {
    files: ["scripts/**.js", "gulpfile.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
