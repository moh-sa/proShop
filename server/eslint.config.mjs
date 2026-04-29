// @ts-check
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginN from "eslint-plugin-n";
import packageJson from "eslint-plugin-package-json";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
	globalIgnores(["dist/**", "node_modules/**", "bruno/**"]),

	js.configs.recommended,

	{
		files: ["src/**/*.ts"],

		extends: [tseslint.configs.recommended],

		languageOptions: {
			globals: globals.node,
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
			},
		},

		plugins: {
			n: pluginN,
			perfectionist,
		},

		rules: {
			// --- TypeScript ---
			// Base `no-unused-vars` ignores TS types; use the TS rule instead.
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "all",
					caughtErrors: "all",
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-explicit-any": "error",

			// --- Imports & type-only imports ---
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{ fixStyle: "inline-type-imports", prefer: "type-imports" },
			],
			// Pairs with consistent-type-imports (avoids stray side-effect-only imports).
			"@typescript-eslint/no-import-type-side-effects": "error",

			// --- Node ---
			"n/prefer-node-protocol": "error",
			// Prefer setting `process.exitCode` over `process.exit()` so async work can finish.
			"n/no-process-exit": "warn",

			// --- Sort imports & exports (perfectionist) ---
			"perfectionist/sort-imports": [
				"error",
				{
					groups: [
						["builtin", "builtin-type"],
						["external", "external-type"],
						[
							"internal",
							"internal-type",
							"parent",
							"parent-type",
							"sibling",
							"sibling-type",
							"index",
							"index-type",
						],
					],
					newlinesBetween: "always",
					order: "asc",
					type: "natural",
				},
			],

			"perfectionist/sort-named-imports": [
				"error",
				{ order: "asc", type: "natural" },
			],

			"perfectionist/sort-exports": [
				"error",
				{ order: "asc", type: "natural" },
			],

			"perfectionist/sort-named-exports": [
				"error",
				{ order: "asc", type: "natural" },
			],
		},
	},

	packageJson.configs.recommended,
	packageJson.configs.stylistic,

	// Last: turns off ESLint rules that conflict with Prettier.
	eslintConfigPrettier,
);
