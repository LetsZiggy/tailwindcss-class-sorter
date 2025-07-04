/**
 * @type {import("prettier").Config}
 * @see https://prettier.io/docs/configuration
 */
export default {
	// ---Plugins--- //

	plugins: [
		"prettier-plugin-organize-attributes",
		"prettier-plugin-pkg",
		"prettier-plugin-tsconfig",
		/* "prettier-plugin-tailwindcss", */
	],

	// ---Options--- //

	/* printWidth: 120, */
	/* tabWidth: 2, */
	/* useTabs: true, */
	semi: false,
	singleQuote: false,
	quoteProps: "consistent",
	jsxSingleQuote: false,
	trailingComma: "all",
	bracketSpacing: true,
	bracketSameLine: true,
	arrowParens: "always",
	rangeStart: 0,
	rangeEnd: Number.POSITIVE_INFINITY,
	/* parser: "", */
	/* filepath: "", */
	requirePragma: false,
	insertPragma: false,
	proseWrap: "preserve",
	htmlWhitespaceSensitivity: "css",
	vueIndentScriptAndStyle: false,
	/* endOfLine: "lf", */
	embeddedLanguageFormatting: "auto",
	singleAttributePerLine: true,

	// ---prettier-plugin-tailwindcss--- //

	/* tailwindConfig: "./tailwind.config.js", */

	// ---Overrides--- //

	/*
	overrides: [
		{
			files: ["*.html"],
			options: {},
		},
	],
	*/
}
