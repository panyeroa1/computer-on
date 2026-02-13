import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const nextPlugin = require("@next/eslint-plugin-next");
const nextParser = require("eslint-config-next/parser");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

export default [
  // Next's Babel parser handles TS/TSX/JSX without additional setup.
  {
    name: "next/babel-parser",
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: nextParser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: "module",
        allowImportExportEverywhere: true,
        babelOptions: {
          presets: ["next/babel"],
          caller: { supportsTopLevelAwait: true },
        },
      },
    },
  },
  nextPlugin.configs["core-web-vitals"],
  {
    name: "react-hooks/recommended",
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: reactHooksPlugin.configs.recommended.rules,
  },
];
