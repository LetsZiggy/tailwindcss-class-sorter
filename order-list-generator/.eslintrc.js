module.exports = {
	"root": true,
	"parser": "@babel/eslint-parser",
	"parserOptions": {
		ecmaVersion: "latest",
		sourceType: "module",
	},
	"plugins": [ "unicorn" ],
	"env": {
		es6: true,
		node: true,
	},
	"extends": [ "standard", "plugin:unicorn/recommended" ],
	"rules": {
		// ---EcmaScript - Possible Problems--- //

		"no-inner-declarations": [ "error" ], // Overwrite StandardJS

		"no-unused-vars": [ "warn", { vars: "all", args: "none", ignoreRestSiblings: true }], // Overwrite StandardJS

		// ---EcmaScript - Suggestions--- //

		"no-useless-escape": [ "off" ], // Set

		"one-var": [ "error", "never" ], // Overwrite StandardJS

		"operator-assignment": [ "error", "always" ], // Set

		"prefer-regex-literals": [ "off" ], // Set

		"quote-props": [ "error", "consistent-as-needed", { keywords: true }], // Overwrite StandardJS

		// ---EcmaScript - Layout & Formatting--- //

		"array-bracket-spacing": [ "error", "always", { arraysInArrays: false, objectsInArrays: false }], // Overwrite StandardJS

		"arrow-parens": [ "error", "always" ], // Set

		"brace-style": [ "error", "stroustrup", { allowSingleLine: true }], // Overwrite StandardJS

		"comma-dangle": [ "error", "always-multiline" ], // Overwrite StandardJS

		"indent": [ "error", "tab", { SwitchCase: 1, VariableDeclarator: "first", outerIIFEBody: 1, MemberExpression: "off", FunctionDeclaration: { parameters: 1, body: 1 }, FunctionExpression: { parameters: 1, body: 1 }, CallExpression: { arguments: 1 }, ArrayExpression: 1, ObjectExpression: 1, ImportDeclaration: 1, flatTernaryExpressions: false, ignoreComments: false, ignoredNodes: [ "TemplateLiteral *" ] }], // Overwrite StandardJS

		"no-mixed-spaces-and-tabs": [ "error", "smart-tabs" ], // Overwrite StandardJS

		"no-multiple-empty-lines": [ "error", { max: 1, maxEOF: 1, maxBOF: 0 }], // Overwrite StandardJS

		"no-tabs": [ "off", { allowIndentationTabs: true }], // Overwrite StandardJS

		"operator-linebreak": [ "error", "before" ], // Overwrite StandardJS

		"quotes": [ "error", "double", { avoidEscape: true, allowTemplateLiterals: true }], // Overwrite StandardJS

		"template-curly-spacing": [ "error", "always" ], // Overwrite StandardJS

		// ---Unicorn--- //

		"unicorn/prefer-at": [ "error" ], // Set

		"unicorn/prefer-module": [ "off" ], // Set

		"unicorn/prefer-string-replace-all": [ "error" ], // Set

		"unicorn/prefer-top-level-await": [ "off" ], // Set

		"unicorn/prevent-abbreviations": [ "off" ], // Set

		"unicorn/no-array-reduce": [ "off" ], // Set

		"unicorn/no-array-for-each": [ "off" ], // Set

		"unicorn/prefer-object-from-entries": [ "off" ], // Set
	},
}
