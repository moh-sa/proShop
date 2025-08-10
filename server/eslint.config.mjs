import eslint from "@eslint/js";
import n from "eslint-plugin-n";
import packageJson from "eslint-plugin-package-json";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "dist/**", "*.config.*", ".env*"],
  },
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
  },
  eslint.configs.recommended,
  n.configs["flat/recommended"],
  packageJson.configs.recommended,
  perfectionist.configs["recommended-natural"],
  {
    extends: [tseslint.configs.strict],
    files: ["**/*.{js,ts}"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.*s"],
        },
      },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: true },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowBoolean: true, allowNullish: true, allowNumber: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/array-type": ["warn", { default: "generic" }],

      // Node rules
      "n/no-unsupported-features/node-builtins": [
        "error",
        { allowExperimental: true, ignores: ["import.meta.dirname"] },
      ],
      "n/prefer-global/process": ["error", "always"],
      "n/prefer-global/buffer": ["error", "always"],

      // General code quality rules
      // Stylistic concerns that don't interfere with Prettier
      "logical-assignment-operators": [
        "error",
        "always",
        { enforceForIfStatements: true },
      ],
      "no-useless-rename": "error",
      "object-shorthand": "error",
      "operator-assignment": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],

      // Error handling rules
      "prefer-promise-reject-errors": "error",

      // Performance and best practices rules
      "no-await-in-loop": "warn",
      "require-atomic-updates": "warn",
    },
    settings: {
      perfectionist: { partitionByComment: true, type: "natural" },
    },
  },

  // Test files configuration
  {
    files: ["**/*.test.{js,ts}", "**/*.spec.{js,ts}", "**/tests/**/*.{js,ts}"],
    rules: {
      // Relax some rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "n/no-unpublished-import": "off",
      "no-console": "off",

      // Test-specific best practices
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern:
            "^_|^(it|describe|test|suite|before|after|beforeEach|afterEach)$",
        },
      ],
    },
  },

  // Configuration files
  {
    files: ["*.config.{js,ts,mjs}", "*.setup.{js,ts}"],
    rules: {
      "n/no-unpublished-import": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
);
