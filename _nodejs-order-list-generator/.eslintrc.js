/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("node:path")

module.exports = {
	"extends": [
		// "eslint:recommended",
		// "plugin:@typescript-eslint/recommended",
		// "plugin:@typescript-eslint/recommended-requiring-type-checking",
		"standard-with-typescript",
		"plugin:unicorn/recommended",
	],
	"root": true,
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		ecmaVersion: "latest",
		sourceType: "module",
		project: [
			path.join(__dirname, "tsconfig.json"),
		],
		tsconfigRootDir: __dirname,
	},
	"plugins": [ "@typescript-eslint", "@stylistic", "unicorn" ],
	"env": {
		es6: true,
		node: true,
	},
	"rules": {
		// ---EcmaScript - Possible Problems--- //

		"no-inner-declarations": [ "error" ], // Overwrite StandardJS

		"no-unused-vars": [ "off" ], // Overwrite StandardJS
		"@typescript-eslint/no-unused-vars": [ "warn", { vars: "all", args: "none", ignoreRestSiblings: true }], // Overwrite StandardJS

		// ---EcmaScript - Suggestions--- //

		"arrow-body-style": [ "error", "as-needed" ], // Set

		"no-nested-ternary": [ "off" ], // Set
		"unicorn/no-nested-ternary": [ "off" ], // Set

		"no-redeclare": [ "off" ], // Set
		"@typescript-eslint/no-redeclare": [ "error", { ignoreDeclarationMerge: true }], // Set

		"no-shadow": [ "off" ], // Set
		"@typescript-eslint/no-shadow": [ "error" ], // Set

		"one-var": [ "error", "never" ], // Overwrite StandardJS

		"operator-assignment": [ "error", "always" ], // Set

		"sort-imports": [ "error", { ignoreDeclarationSort: true, allowSeparatedGroups: true }], // Set

		// ---EcmaScript - Layout & Formatting--- //

		/* --- */

		// ---ECMAScript - Suggestions - Depreciated <until StandardJS remove>--- //

		"no-confusing-arrow": [ "off" ],
		"no-extra-semi": [ "off" ],
		"@typescript-eslint/no-extra-semi": [ "off" ],
		"no-floating-decimal": [ "off" ],
		"no-mixed-operators": [ "off" ],
		"no-new-object": [ "off" ],
		"no-return-await": [ "off" ],
		"one-var-declaration-per-line": [ "off" ],
		"quote-props": [ "off" ],
		"spaced-comment": [ "off" ],

		// ---ECMAScript - Layout & Formatting - Depreciated <until StandardJS remove>--- //

		"array-bracket-newline": [ "off" ],
		"array-bracket-spacing": [ "off" ],
		"array-element-newline": [ "off" ],
		"arrow-parens": [ "off" ],
		"arrow-spacing": [ "off" ],
		"block-spacing": [ "off" ],
		"@typescript-eslint/block-spacing": [ "off" ],
		"brace-style": [ "off" ],
		"@typescript-eslint/brace-style": [ "off" ],
		"comma-dangle": [ "off" ],
		"@typescript-eslint/comma-dangle": [ "off" ],
		"comma-spacing": [ "off" ],
		"@typescript-eslint/comma-spacing": [ "off" ],
		"comma-style": [ "off" ],
		"computed-property-spacing": [ "off" ],
		"dot-location": [ "off" ],
		"eol-last": [ "off" ],
		"func-call-spacing": [ "off" ],
		"@typescript-eslint/func-call-spacing": [ "off" ],
		"function-call-argument-newline": [ "off" ],
		"function-paren-newline": [ "off" ],
		"generator-star-spacing": [ "off" ],
		"implicit-arrow-linebreak": [ "off" ],
		"indent": [ "off" ],
		"@typescript-eslint/indent": [ "off" ],
		"jsx-quotes": [ "off" ],
		"key-spacing": [ "off" ],
		"@typescript-eslint/key-spacing": [ "off" ],
		"keyword-spacing": [ "off" ],
		"@typescript-eslint/keyword-spacing": [ "off" ],
		"linebreak-style": [ "off" ],
		"lines-around-comment": [ "off" ],
		"@typescript-eslint/lines-around-comment": [ "off" ],
		"lines-between-class-members": [ "off" ],
		"@typescript-eslint/lines-between-class-members": [ "off" ],
		"max-len": [ "off" ],
		"max-statements-per-line": [ "off" ],
		"multiline-ternary": [ "off" ],
		"new-parens": [ "off" ],
		"newline-per-chained-call": [ "off" ],
		"no-extra-parens": [ "off" ],
		"@typescript-eslint/no-extra-parens": [ "off" ],
		"no-mixed-spaces-and-tabs": [ "off" ],
		"no-multi-spaces": [ "off" ],
		"no-multiple-empty-lines": [ "off" ],
		"no-tabs": [ "off" ],
		"no-trailing-spaces": [ "off" ],
		"no-whitespace-before-property": [ "off" ],
		"nonblock-statement-body-position": [ "off" ],
		"object-curly-newline": [ "off" ],
		"object-curly-spacing": [ "off" ],
		"@typescript-eslint/object-curly-spacing": [ "off" ],
		"object-property-newline": [ "off" ],
		"operator-linebreak": [ "off" ],
		"padded-blocks": [ "off" ],
		"padding-line-between-statements": [ "off" ],
		"@typescript-eslint/padding-line-between-statements": [ "off" ],
		"quotes": [ "off" ],
		"@typescript-eslint/quotes": [ "off" ],
		"rest-spread-spacing": [ "off" ],
		"semi": [ "off" ],
		"@typescript-eslint/semi": [ "off" ],
		"semi-spacing": [ "off" ],
		"semi-style": [ "off" ],
		"space-before-blocks": [ "off" ],
		"@typescript-eslint/space-before-blocks": [ "off" ],
		"space-before-function-paren": [ "off" ],
		"@typescript-eslint/space-before-function-paren": [ "off" ],
		"space-in-parens": [ "off" ],
		"space-infix-ops": [ "off" ],
		"@typescript-eslint/space-infix-ops": [ "off" ],
		"space-unary-ops": [ "off" ],
		"switch-colon-spacing": [ "off" ],
		"template-curly-spacing": [ "off" ],
		"template-tag-spacing": [ "off" ],
		"wrap-iife": [ "off" ],
		"wrap-regex": [ "off" ],
		"yield-star-spacing": [ "off" ],

		// ---TypeScript--- //

		"@typescript-eslint/ban-types": [ "error" ], // Set

		"@typescript-eslint/naming-convention": [ "error", { selector: [ "typeLike" ], format: [ "PascalCase" ]}, { selector: [ "variable" ], format: [ "camelCase", "UPPER_CASE", "PascalCase" ], leadingUnderscore: "allow", trailingUnderscore: "allow" }, { selector: [ "interface" ], format: [ "PascalCase" ], custom: { regex: "^I[A-Z]", match: false }}], // Overwrite StandardJS

		"@typescript-eslint/no-floating-promises": [ "off" ], // Overwrite StandardJS

		"@typescript-eslint/consistent-type-imports": [ "error", { prefer: "type-imports", disallowTypeAnnotations: true }], // Set

		"@typescript-eslint/no-unsafe-argument": [ "off" ], // Set

		"@typescript-eslint/strict-boolean-expressions": [ "off" ], // Overwrite StandardJS

		// ---TypeScript - Supported Rules - Depreciated <until StandardJS remove>--- //

		"@typescript-eslint/no-type-alias": [ "off" ],

		// ---stylistic--- //

		"@stylistic/array-bracket-newline": [ "error", "consistent" ],

		"@stylistic/array-bracket-spacing": [ "error", "always", { arraysInArrays: false, objectsInArrays: false }],

		"@stylistic/array-element-newline": [ "error", "consistent" ],

		"@stylistic/arrow-parens": [ "error", "always" ],

		"@stylistic/arrow-spacing": [ "error", { before: true, after: true }],

		"@stylistic/block-spacing": [ "error", "always" ],

		"@stylistic/brace-style": [ "error", "stroustrup", { allowSingleLine: true }],

		"@stylistic/comma-dangle": [ "error", "always-multiline" ],

		"@stylistic/comma-spacing": [ "error", { before: false, after: true }],

		"@stylistic/comma-style": [ "error", "last" ],

		"@stylistic/computed-property-spacing": [ "error", "never" ],
		"@stylistic/dot-location": [ "error", "property" ],

		"@stylistic/eol-last": [ "error", "always" ],

		"@stylistic/func-call-spacing": [ "error", "never" ],

		"@stylistic/function-call-argument-newline": [ "error", "consistent" ],

		"@stylistic/function-paren-newline": [ "error", "multiline" ],

		"@stylistic/generator-star-spacing": [ "error", { before: true, after: false, named: "before", anonymous: "after", method: "before" }],

		"@stylistic/implicit-arrow-linebreak": [ "off" ],

		"@stylistic/indent": [ "error", "tab", { ignoredNodes: [ "TemplateLiteral *", "TSTypeParameterInstantiation" ], SwitchCase: 1, VariableDeclarator: "first", outerIIFEBody: 1, MemberExpression: "off", FunctionDeclaration: { parameters: 1, body: 1 }, FunctionExpression: { parameters: 1, body: 1 }, StaticBlock: { body: 1 }, CallExpression: { arguments: 1 }, ArrayExpression: 1, ObjectExpression: 1, ImportDeclaration: 1, flatTernaryExpressions: false, offsetTernaryExpressions: false, ignoreComments: false }],

		"@stylistic/jsx-quotes": [ "off" ],

		"@stylistic/key-spacing": [ "error", { beforeColon: false, afterColon: true, mode: "strict" }],

		"@stylistic/keyword-spacing": [ "error", { before: true, after: true }],

		"@stylistic/linebreak-style": [ "error", "unix" ],

		"@stylistic/lines-around-comment": [ "off" ],

		"@stylistic/lines-between-class-members": [ "error", "always", { exceptAfterSingleLine: true, exceptAfterOverload: true }],

		"@stylistic/max-len": [ "off" ],

		"@stylistic/max-statements-per-line": [ "off" ],

		"@stylistic/multiline-ternary": [ "error", "always-multiline" ],

		"@stylistic/new-parens": [ "error", "never" ],

		"@stylistic/newline-per-chained-call": [ "error", { ignoreChainWithDepth: 3 }],

		"@stylistic/no-confusing-arrow": [ "error", { allowParens: true, onlyOneSimpleParam: true }],

		"@stylistic/no-extra-parens": [ "error", "functions" ],

		"@stylistic/no-extra-semi": [ "error" ],

		"@stylistic/no-floating-decimal": [ "error" ],

		"@stylistic/no-mixed-operators": [ "error", { allowSamePrecedence: true }],

		"@stylistic/no-mixed-spaces-and-tabs": [ "error", "smart-tabs" ],

		"@stylistic/no-multi-spaces": [ "error", { ignoreEOLComments: false }],

		"@stylistic/no-multiple-empty-lines": [ "error", { max: 1, maxEOF: 1, maxBOF: 0 }],

		"@stylistic/no-tabs": [ "error", { allowIndentationTabs: true }],

		"@stylistic/no-trailing-spaces": [ "error" ],

		"@stylistic/no-whitespace-before-property": [ "error" ],

		"@stylistic/nonblock-statement-body-position": [ "error", "beside" ],

		"@stylistic/object-curly-newline": [ "error", { consistent: true }],

		"@stylistic/object-curly-spacing": [ "error", "always", { arraysInObjects: false, objectsInObjects: false }],

		"@stylistic/object-property-newline": [ "error", { allowAllPropertiesOnSameLine: true }],

		"@stylistic/one-var-declaration-per-line": [ "error", "initializations" ],

		"@stylistic/operator-linebreak": [ "error", "before", { overrides: { "??": "before" }}],

		"@stylistic/padded-blocks": [ "error", "never" ],

		"@stylistic/padding-line-between-statements": [ "error", { blankLine: "always", prev: "directive", next: "*" }, { blankLine: "any", prev: "directive", next: "directive" }, { blankLine: "always", prev: [ "const", "let", "var" ], next: "*" }, { blankLine: "any", prev: [ "const", "let", "var" ], next: [ "const", "let", "var" ]}, { blankLine: "always", prev: "*", next: [ "break", "continue", "return", "throw", "try" ]}],

		"@stylistic/quote-props": [ "error", "consistent-as-needed", { keywords: true }],

		"@stylistic/quotes": [ "error", "double", { avoidEscape: true, allowTemplateLiterals: true }],

		"@stylistic/rest-spread-spacing": [ "error" ],

		"@stylistic/semi": [ "error", "never", { beforeStatementContinuationChars: "always" }],

		"@stylistic/semi-spacing": [ "error" ],

		"@stylistic/semi-style": [ "error", "first" ],

		"@stylistic/space-before-blocks": [ "error" ],

		"@stylistic/space-before-function-paren": [ "error" ],

		"@stylistic/space-in-parens": [ "error", "never" ],

		"@stylistic/space-infix-ops": [ "error", { int32Hint: false }],

		"@stylistic/space-unary-ops": [ "error" ],

		"@stylistic/spaced-comment": [ "error", "always" ],

		"@stylistic/switch-colon-spacing": [ "error" ],

		"@stylistic/template-curly-spacing": [ "error", "always" ],

		"@stylistic/template-tag-spacing": [ "error" ],

		"@stylistic/wrap-iife": [ "error", "inside" ],

		"@stylistic/wrap-regex": [ "error" ],

		"@stylistic/yield-star-spacing": [ "error", "after" ],

		"@stylistic/member-delimiter-style": [ "error", { multiline: { delimiter: "comma", requireLast: true }, singleline: { delimiter: "comma", requireLast: false }}],

		"@stylistic/type-annotation-spacing": [ "error" ],

		"@stylistic/jsx-child-element-spacing": [ "off" ],

		"@stylistic/jsx-closing-bracket-location": [ "off" ],

		"@stylistic/jsx-closing-tag-location": [ "off" ],

		"@stylistic/jsx-curly-brace-presence": [ "off" ],

		"@stylistic/jsx-curly-newline": [ "off" ],

		"@stylistic/jsx-curly-spacing": [ "off" ],

		"@stylistic/jsx-equals-spacing": [ "off" ],

		"@stylistic/jsx-first-prop-new-line": [ "off" ],

		"@stylistic/jsx-indent": [ "off" ],

		"@stylistic/jsx-indent-props": [ "off" ],

		"@stylistic/jsx-max-props-per-line": [ "off" ],

		"@stylistic/jsx-newline": [ "off" ],

		"@stylistic/jsx-one-expression-per-line": [ "off" ],

		"@stylistic/jsx-props-no-multi-spaces": [ "off" ],

		"@stylistic/jsx-self-closing-comp": [ "off" ],

		"@stylistic/jsx-sort-props": [ "off" ],

		"@stylistic/jsx-tag-spacing": [ "off" ],

		"@stylistic/jsx-wrap-multilines": [ "off" ],

		// ---import--- //

		"import/order": [ "error", { "groups": [ "builtin", "external", "internal", "parent", "sibling", "index", "unknown", "object", "type" ], "alphabetize": { order: "asc", caseInsensitive: false }, "newlines-between": "never" }], // Set

		// ---Unicorn--- //

		"unicorn/prefer-at": [ "error" ], // Overwrite unicorn

		"unicorn/prefer-module": [ "off" ], // Overwrite unicorn

		"unicorn/prefer-string-replace-all": [ "error" ], // Overwrite unicorn

		"unicorn/prevent-abbreviations": [ "error", { checkFilenames: false }], // Overwrite unicorn

		"unicorn/no-array-reduce": [ "off" ], // Overwrite unicorn

		"unicorn/no-useless-undefined": [ "off" ], // Overwrite unicorn
	},
}
