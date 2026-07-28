import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";

export default defineConfig([
  {
    ignores: [
      "android/app/build/**",
      "android/build/**",
      "android/.gradle/**",
      "android/app/src/main/assets/**",
      ".next/**",
      "out/**",
    ],
  },
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: nextPlugin.configs.recommended.rules,
  },
]);