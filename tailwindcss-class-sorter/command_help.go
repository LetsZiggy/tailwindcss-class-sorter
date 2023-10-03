package main

import (
	"fmt"
)

var (
	configLink  string       = "https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/config.json"
	helpStrings THelpStrings = THelpStrings{
		format: TFormatHelpStrings{
			code: []string{
				"- base64-encoded string to format and outputs to stdout",
				"- if set, file paths/globs will be ignored",
				"- if set, \"--code-ext\" flag must be set",
				"- if set, \"--config\" flag will be parsed as base64-encoded json string",
			},
			codeExt: []string{
				"- indicates the filetype of the \"--code\" flag base64-encoded string,",
				"eg. [\"html\" | \"css\" | \"pug\"] in the default \"extensions_regex\" config option",
				"- \"--code-ext\" will be used as key to \"extensions_regex\" config option",
				"- if \"--code\" flag is set, \"--code-ext\" flag must be set",
			},
			config: []string{
				"- see " + configLink,
				"for full list of config options",
				"- \"--config\" flag is optional; partial config is valid;",
				"unset config options will fallback to the default config values",
				"- if \"--code\" flag is set, \"--config\" flag expects base64-encoded",
				"json string",
				"- if \"--code\" flag is not set, \"--config\" flag expects a valid path",
				"to config json file",
			},
		},
		list: TListHelpStrings{
			base64: []string{
				"- if set, order-list outputs as base64-encoded json string",
				"- if not set, order-list outputs as tabbed json string",
			},
			config: []string{
				"- see " + configLink,
				"for full list of config options",
				"- \"--config\" flag is optional; partial config is valid;",
				"unset config options will fallback to the default config values",
				"- if \"--base64\" flag is set, \"--config\" flag expects base64-encoded",
				"json string",
				"- if \"--base64\" flag is not set, \"--config\" flag expects a valid path",
				"to config json file",
			},
			showEditedOrder: []string{
				"- outputs edited order-list with indices, i.e. \"edit_order\" config option",
				"will be implemented to the order-list output",
				"- don't use edited order-list as reference for \"edit_order\" config option;",
				"instead, use the unedited order-list as reference by removing",
				"\"--show-edited-order\" flag",
			},
		},
	}
)

func helpCommand(fullHelp bool) {
	fmt.Print(
		padString("tailwindcss-class-sorter [subcommands] [options?] [globs?]", "", 0, 0, 0, 2),
		padString("Subcommands:", "", 0, 0, 0, 1),
	)
	fmt.Print(
		padString("format [options] [globs?]", "  ", 1, 0, 0, 1),
		padString("Formats files through multiple space separated file paths/globs", "  ", 2, 0, 0, 1),
		padString("or base64-encoded string input using the \"--code\" flag", "  ", 2, 0, 0, 1),
	)
	if fullHelp {
		fmt.Print(
			padString("Options:", "  ", 2, 0, 1, 1),
			padString("--code [string]", "  ", 3, 0, 0, 1),
			padString(helpStrings.format.code[0], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.code[1], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.code[2], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.code[3], "  ", 5, 0, 0, 1),
			padString("--code-ext [string]", "  ", 3, 0, 0, 1),
			padString(helpStrings.format.codeExt[0], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.codeExt[1], "  ", 6, 0, 0, 1),
			padString(helpStrings.format.codeExt[2], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.codeExt[3], "  ", 5, 0, 0, 1),
			padString("--config [string]", "  ", 3, 0, 0, 1),
			padString(helpStrings.format.config[0], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.config[1], "  ", 6, 0, 0, 1),
			padString(helpStrings.format.config[2], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.config[3], "  ", 6, 0, 0, 1),
			padString(helpStrings.format.config[4], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.config[5], "  ", 6, 0, 0, 1),
			padString(helpStrings.format.config[6], "  ", 5, 0, 0, 1),
			padString(helpStrings.format.config[7], "  ", 6, 0, 0, 1),
		)
	}
	fmt.Print(
		padString("help", "  ", 1, 0, 1, 1),
		padString("Display available subcommands and their respective options", "  ", 2, 0, 0, 1),
	)
	fmt.Print(
		padString("list [options]", "  ", 1, 0, 1, 1),
		padString("Prints out order-list in prettified json string or in base64-encoded string.", "  ", 2, 0, 0, 1),
		padString("The \"--show-edited-order\" flag will output the order-list with \"edit_order\"", "  ", 2, 0, 0, 1),
		padString("config option implemented. Use the unedited order-list as reference", "  ", 2, 0, 0, 1),
		padString("for \"edit_order\" config option", "  ", 2, 0, 0, 1),
	)
	if fullHelp {
		fmt.Print(
			padString("Options:", "  ", 2, 0, 1, 1),
			padString("--base64", "  ", 3, 0, 0, 1),
			padString(helpStrings.list.base64[0], "  ", 5, 0, 0, 1),
			padString(helpStrings.list.base64[1], "  ", 5, 0, 0, 1),
			padString("--config [string]", "  ", 3, 0, 0, 1),
			padString(helpStrings.list.config[0], "  ", 5, 0, 0, 1),
			padString(helpStrings.list.config[1], "  ", 6, 0, 0, 1),
			padString(helpStrings.list.config[2], "  ", 5, 0, 0, 1),
			padString(helpStrings.list.config[3], "  ", 6, 0, 0, 1),
			padString(helpStrings.list.config[4], "  ", 5, 0, 0, 1),
			padString(helpStrings.list.config[5], "  ", 6, 0, 0, 1),
			padString(helpStrings.list.config[6], "  ", 5, 0, 0, 1),
			padString(helpStrings.list.config[7], "  ", 6, 0, 0, 1),
			padString("--show-edited-order", "  ", 3, 0, 0, 1),
			padString(helpStrings.list.showEditedOrder[0], "  ", 5, 0, 0, 1),
			padString(helpStrings.list.showEditedOrder[1], "  ", 6, 0, 0, 1),
			padString(helpStrings.list.showEditedOrder[2], "  ", 5, 0, 0, 1),
			padString(helpStrings.list.showEditedOrder[3], "  ", 6, 0, 0, 1),
			padString(helpStrings.list.showEditedOrder[4], "  ", 6, 0, 0, 1),
		)
	}
}
