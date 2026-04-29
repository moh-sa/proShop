//  @ts-check

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
	printWidth: 80,
	semi: true,
	singleQuote: false,
	trailingComma: "all",
	tabWidth: 2,
	useTabs: true,
	quoteProps: "as-needed",
	arrowParens: "always",
	bracketSpacing: true,
	plugins: ["prettier-plugin-tailwindcss"],
	tailwindStylesheet: "./src/index.css",
};

export default config;
