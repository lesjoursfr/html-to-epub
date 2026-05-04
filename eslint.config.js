import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2022,
        globals: {
          ...globals.es2022,
          ...globals.nodeBuiltin,
        },
      },
    },
  },
  prettierConfig,
  {
    ignores: [
      "package.json",
      "eslint.config.js",
      "prettier.config.js",
      "node_modules/*",
      ".yarn/*",
      "lib/*",
      "tempDir/*",
      "tests/*.epub",
    ],
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  }
);
