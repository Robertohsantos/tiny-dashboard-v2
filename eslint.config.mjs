import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";
import saasPlugin from "./eslint-rules/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const tsConfigs = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ['**/*.{ts,tsx}'],
}));

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      ".cache/**",
      "eslint.config.*",
      "src/generated/**",
      "src/@igniter-js/**",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tsConfigs,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@saas-boilerplate/eslint-plugin": saasPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-types": "off",
      "react/no-unescaped-entities": "off",
      "no-useless-constructor": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      "@saas-boilerplate/eslint-plugin/no-presentation-exports": "off",
      "@saas-boilerplate/eslint-plugin/no-controller-imports": "off",
      "@saas-boilerplate/eslint-plugin/no-procedure-imports": "off",
      "@saas-boilerplate/eslint-plugin/no-server-side-imports": "off",
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      '@saas-boilerplate/eslint-plugin/no-controller-imports': 'off',
      '@saas-boilerplate/eslint-plugin/no-presentation-exports': 'off',
      '@saas-boilerplate/eslint-plugin/no-procedure-imports': 'off',
      '@saas-boilerplate/eslint-plugin/no-server-side-imports': 'off',
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      'react/display-name': 'off',
      '@next/next/no-assign-module-variable': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
