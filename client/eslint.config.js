import js from "@eslint/js";
import query from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier";
import packageJson from "eslint-plugin-package-json";
import perfectionist from "eslint-plugin-perfectionist";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
	globalIgnores(["dist", "node_modules/**", "src/routeTree.gen.ts"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
			query.configs["flat/recommended"],
			packageJson.configs.recommended,
			packageJson.configs.stylistic,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			perfectionist,
		},
	},
	eslintConfigPrettier,
]);
