// @ts-check
import js from "@eslint/js";
import eslintImport from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    ignores: [
      "**/node_modules/**",
      "app/function/utils/encoder.js",
      "app/function/utils/encoder.d.ts",
      "app/service/auth/encrypt.js",
      "app/service/auth/encrypt.d.ts",
      "dist/**",
      "server/**",
    ],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        parser: tseslint.parser,
        tsconfigDirName: import.meta.dirname,
        project: ["./tsconfig.json"],
        extraFileExtensions: [".wxs"],
      },
    },
  },
  {
    files: ["**/*.{cjs,js,wxs}"],
    ...tseslint.configs.disableTypeChecked,
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
    plugins: {
      import: eslintImport,
    },
    rules: {
      curly: ["error", "multi", "consistent"],
      "no-duplicate-imports": "off",
      "no-unmodified-loop-condition": "error",
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: ["const", "let"],
          next: ["*"],
        },
        {
          blankLine: "any",
          prev: ["const", "let"],
          next: ["const", "let"],
        },
        {
          blankLine: "always",
          prev: ["*"],
          next: ["return"],
        },
      ],
      "sort-imports": [
        "error",
        {
          allowSeparatedGroups: false,
          ignoreDeclarationSort: true,
        },
      ],

      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-commonjs": "error",
      "import/no-cycle": "error",
      "import/no-duplicates": ["error", { considerQueryString: true }],
      "import/no-named-default": "error",
      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
            orderImportKind: "asc",
          },
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "object",
          ],
          "newlines-between": "always",
        },
      ],
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
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
      "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },
  {
    files: ["app/**/*.wxs", "gulpfile.cjs"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "import/no-commonjs": "off",
      "import/no-default-export": "off",
      "import/no-named-export": "off",
    },
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
    },
  },
  {
    files: ["scripts/**.js", "gulpfile.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  eslintPluginPrettierRecommended,
);
