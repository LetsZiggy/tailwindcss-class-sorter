/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, import/no-named-as-default-member */
/* eslint @stylistic/migrate/migrate-js: "error" */
/* eslint @stylistic/migrate/migrate-ts: "error" */

import path from "node:path"
import eslint from "@eslint/js"
import stylisticPlugin from "@stylistic/eslint-plugin"
// @ts-expect-error: package type error
import stylisticMigratePlugin from "@stylistic/eslint-plugin-migrate"
// @ts-expect-error: package type error
import importPlugin from "eslint-plugin-import"
import nodePlugin from "eslint-plugin-n"
// @ts-expect-error: package type error
import promisePlugin from "eslint-plugin-promise"
// @ts-expect-error: package type error
import sortClassMembersPlugin from "eslint-plugin-sort-class-members"
// @ts-expect-error: package type error
import sortDestructureKeysPlugin from "eslint-plugin-sort-destructure-keys"
import unicornPlugin from "eslint-plugin-unicorn"
import globals from "globals"
import tseslint from "typescript-eslint"

const rootRules = {
	// ---eslint - Possible Problems--- //

	"no-inner-declarations": ["error"], // Overwrite eslint default

	"no-invalid-regexp": ["error", { allowConstructorFlags: ["u"/* , "y" */] }], // Overwrite eslint default | enable `y` flag for adonisjs

	"no-unused-vars": ["off"], // Overwrite eslint default
	"@typescript-eslint/no-unused-vars": ["warn", { vars: "all", args: "none", ignoreRestSiblings: true }], // Overwrite tseslint default

	// ---eslint - Suggestions--- //

	"no-nested-ternary": ["off"], // Set
	"unicorn/no-nested-ternary": ["off"], // Set

	"no-redeclare": ["off"], // Overwrite eslint default
	"@typescript-eslint/no-redeclare": ["error", { ignoreDeclarationMerge: true }], // Set

	"no-shadow": ["off"], // Set
	"@typescript-eslint/no-shadow": ["error"], // Set

	"one-var": ["error", "never"], // Set

	"operator-assignment": ["error", "always"], // Set

	"sort-imports": ["error", { ignoreDeclarationSort: true, allowSeparatedGroups: true }], // Set

	// ---@typescript-eslint--- //

	"@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", disallowTypeAnnotations: true }], // Set

	"@typescript-eslint/naming-convention": ["error", { selector: ["class"], format: ["PascalCase"] }, { selector: ["classProperty"], format: ["camelCase"], leadingUnderscore: "allow", trailingUnderscore: "allow" }, { selector: ["interface", "typeLike"], format: ["PascalCase"], custom: { regex: "^I[A-Z]", match: false }}, { selector: ["variable"], format: ["camelCase", "UPPER_CASE", "PascalCase"], leadingUnderscore: "allow", trailingUnderscore: "allow" }], // Set

	"@typescript-eslint/no-floating-promises": ["warn"], // Overwrite tseslint default

	"@typescript-eslint/non-nullable-type-assertion-style": ["warn"], // Overwrite tseslint default

	"@typescript-eslint/strict-boolean-expressions": ["warn"], // Set

	// ---import--- //

	"import/order": ["error", { "groups": ["builtin", "external", "internal", "parent", "sibling", "index", "unknown", "object", "type"], "alphabetize": { order: "asc", caseInsensitive: false }, "newlines-between": "never" }], // Set

	// ---sort-destructure-keys--- //

	"sort-destructure-keys/sort-destructure-keys": ["error", { caseSensitive: true }], // Set

	// ---unicorn--- //

	"unicorn/filename-case": ["error", { cases: { kebabCase: true }}], // Overwrite unicorn | Set { cases: { snakeCase: true }} for adonisjs

	"unicorn/prefer-at": ["error"], // Overwrite unicorn

	"unicorn/prefer-module": ["off"], // Overwrite unicorn

	"unicorn/prefer-string-replace-all": ["error"], // Overwrite unicorn

	"unicorn/prevent-abbreviations": ["error", { checkFilenames: false }], // Overwrite unicorn

	"unicorn/no-array-reduce": ["off"], // Overwrite unicorn

	"unicorn/no-useless-undefined": ["off"], // Overwrite unicorn

	// ---@stylistic--- //

	"@stylistic/array-bracket-newline": ["error", "consistent"],

	"@stylistic/array-bracket-spacing": ["error", "never"],

	"@stylistic/array-element-newline": ["error", "consistent"],

	"@stylistic/arrow-parens": ["error", "always"],

	"@stylistic/arrow-spacing": ["error", { before: true, after: true }],

	"@stylistic/block-spacing": ["error", "always"],

	"@stylistic/brace-style": ["error", "stroustrup", { allowSingleLine: true }],

	"@stylistic/comma-dangle": ["error", "always-multiline"],

	"@stylistic/comma-spacing": ["error", { before: false, after: true }],

	"@stylistic/comma-style": ["error", "last"],

	"@stylistic/computed-property-spacing": ["error", "never", { enforceForClassMembers: true }],

	"@stylistic/dot-location": ["error", "property"],

	"@stylistic/eol-last": ["error", "always"],

	"@stylistic/function-call-argument-newline": ["error", "consistent"],

	"@stylistic/function-call-spacing": ["error", "never"],

	"@stylistic/function-paren-newline": ["error", "multiline"],

	"@stylistic/generator-star-spacing": ["error", "before"],

	"@stylistic/implicit-arrow-linebreak": ["error", "beside"],

	"@stylistic/indent": ["error", "tab", { ignoredNodes: ["TemplateLiteral *", "TSTypeParameterInstantiation"], SwitchCase: 1, VariableDeclarator: "first", outerIIFEBody: 1, MemberExpression: "off", FunctionDeclaration: { parameters: 1, body: 1 }, FunctionExpression: { parameters: 1, body: 1 }, StaticBlock: { body: 1 }, CallExpression: { arguments: 1 }, ArrayExpression: 1, ObjectExpression: 1, ImportDeclaration: 1, flatTernaryExpressions: false, offsetTernaryExpressions: false, ignoreComments: false }],

	"@stylistic/indent-binary-ops": ["error", "tab"],

	"@stylistic/key-spacing": ["error", { beforeColon: false, afterColon: true }],

	"@stylistic/keyword-spacing": ["error", { before: true, after: true }],

	"@stylistic/line-comment-position": ["off"],

	"@stylistic/linebreak-style": ["error", "unix"],

	"@stylistic/lines-around-comment": ["off"],

	"@stylistic/lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true, exceptAfterOverload: true }],

	"@stylistic/max-len": ["off"],

	"@stylistic/max-statements-per-line": ["off"],

	"@stylistic/member-delimiter-style": ["error", { multiline: { delimiter: "comma", requireLast: true }, singleline: { delimiter: "comma", requireLast: false }}],

	"@stylistic/multiline-comment-style": ["off"],

	"@stylistic/multiline-ternary": ["error", "always-multiline"],

	"@stylistic/new-parens": ["error", "always"],

	"@stylistic/newline-per-chained-call": ["error", { ignoreChainWithDepth: 2 }],

	"@stylistic/no-confusing-arrow": ["off"],

	"@stylistic/no-extra-parens": ["off"],

	"@stylistic/no-extra-semi": ["error"],

	"@stylistic/no-floating-decimal": ["error"],

	"@stylistic/no-mixed-operators": ["error", { groups: [["==", "!=", "===", "!==", ">", ">=", "<", "<="], ["&&", "||"], ["in", "instanceof"]], allowSamePrecedence: true }],

	"@stylistic/no-mixed-spaces-and-tabs": ["error", "smart-tabs"],

	"@stylistic/no-multi-spaces": ["error"],

	"@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1, maxBOF: 0 }],

	"@stylistic/no-tabs": ["error", { allowIndentationTabs: true }],

	"@stylistic/no-trailing-spaces": ["error"],

	"@stylistic/no-whitespace-before-property": ["error"],

	"@stylistic/nonblock-statement-body-position": ["error", "beside"],

	"@stylistic/object-curly-newline": ["error", { consistent: true }],

	"@stylistic/object-curly-spacing": ["error", "always", { arraysInObjects: true, objectsInObjects: false }],

	"@stylistic/object-property-newline": ["error", { allowMultiplePropertiesPerLine: true, allowAllPropertiesOnSameLine: false }],

	"@stylistic/one-var-declaration-per-line": ["error", "initializations"],

	"@stylistic/operator-linebreak": ["error", "before", { overrides: { "??": "before" }}],

	"@stylistic/padded-blocks": ["error", "never"],

	"@stylistic/padding-line-between-statements": ["error", { blankLine: "always", prev: "*", next: ["break", "cjs-export", "exports", "return"] }, { blankLine: "always", prev: ["const", "let", "var"], next: "*" }, { blankLine: "any", prev: ["const", "let", "var"], next: ["const", "let", "var"] }, { blankLine: "always", prev: "directive", next: "*" }, { blankLine: "any", prev: "directive", next: "directive" }, { blankLine: "always", prev: ["case", "default"], next: "*" }],

	"@stylistic/quote-props": ["error", "consistent-as-needed", { keywords: true }],

	"@stylistic/quotes": ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],

	"@stylistic/rest-spread-spacing": ["error", "never"],

	"@stylistic/semi": ["error", "never", { beforeStatementContinuationChars: "always" }],

	"@stylistic/semi-spacing": ["error", { before: false, after: true }],

	"@stylistic/semi-style": ["error", "first"],

	"@stylistic/space-before-blocks": ["error", "always"],

	"@stylistic/space-before-function-paren": ["error", "always"],

	"@stylistic/space-in-parens": ["error", "never"],

	"@stylistic/space-infix-ops": ["error", { int32Hint: true }],

	"@stylistic/space-unary-ops": ["error", { words: true, nonwords: false }],

	"@stylistic/spaced-comment": ["error", "always", { line: { exceptions: ["-"] }, block: { balanced: true }}],

	"@stylistic/switch-colon-spacing": ["error", { after: true, before: false }],

	"@stylistic/template-curly-spacing": ["error", "always"],

	"@stylistic/template-tag-spacing": ["error", "never"],

	"@stylistic/type-annotation-spacing": ["error", { before: false, after: true, overrides: { arrow: { before: true, after: true }}}],

	"@stylistic/type-generic-spacing": ["error"],

	"@stylistic/type-named-tuple-spacing": ["error"],

	"@stylistic/wrap-iife": ["error", "inside", { functionPrototypeMethods: true }],

	"@stylistic/wrap-regex": ["error"],

	"@stylistic/yield-star-spacing": ["error", "after"],
}

export default tseslint.config(
	eslint.configs.recommended,
	importPlugin.flatConfigs.recommended,
	nodePlugin.configs["flat/recommended-module"],
	promisePlugin.configs["flat/recommended"],
	sortClassMembersPlugin.configs["flat/recommended"],
	tseslint.configs.recommendedTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	unicornPlugin.configs["flat/recommended"],
	{
		ignores: [
			"**/.git",
			"**/.svn",
			"**/.hg",
			"**/CVS",
			"**/node_modules",
			"**/vendor",
			"**/.env",
			"**/.venv",
			"**/env",
			"**/venv",
			"**/ENV",
			"**/env.bak",
			"**/venv.bak",
			"**/__pycache__",
		],
		plugins: {
			"sort-destructure-keys": sortDestructureKeysPlugin,
			// @ts-expect-error: package type error
			"@stylistic": stylisticPlugin,
			"@stylistic/migrate": stylisticMigratePlugin,
		},
		languageOptions: {
			globals: {
				...globals.builtin,
				...globals.es2025,
				...globals.browser,
				...globals.node,
				...globals.serviceworker,
				...globals["shared-node-browser"],
			},
			parser: tseslint.parser,
			ecmaVersion: "latest",
			sourceType: "module",
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		settings: {
			"import/extensions": [".js", ".cjs", ".mjs", ".ts"],
			"import/parsers": {
				"@typescript-eslint/parser": [".js", ".cjs", ".mjs", ".ts"],
			},
			"import/resolver": {
				node: {
					extensions: [".js", ".cjs", ".mjs", ".ts"],
				},
				typescript: {
					alwaysTryTypes: true,
					project: [path.join(import.meta.dirname, "tsconfig.json")],
				},
			},
		},
		// @ts-expect-error: package type error
		rules: rootRules,
	},
	{
		files: [
			"**/.*.js",
			"**/.*.cjs",
			"**/.*.mjs",
			"**/.*.ts",
			"**/*.js",
			"**/*.cjs",
			"**/*.mjs",
			"**/*.ts",
		],
	},
	{
		files: [
			"**/.*.cjs",
			"**/*.cjs",
		],
		rules: {
			"@typescript-eslint/no-require-imports": ["off"],
		},
	},
	stylisticPlugin.configs["disable-legacy"],
)
