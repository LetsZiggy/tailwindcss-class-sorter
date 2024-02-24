package main

import (
	"fmt"
	"strings"
)

//nolint:unparam // ...
func printHelp(
	command, options string,
	toTrim bool, trimString string, // strings.Trim
	pad string, padLeft, padRight, newlineLeft, newlineRight int, toPadChild bool, parentIdentifier string, // func padString
	linebreakLength int, // func linebreak
) string {
	configLink := "https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/config.json"

	/* ---"format" command--- */
	helpStrings := make(map[string]map[string][]string)

	helpStrings["format"] = make(map[string][]string)
	helpStrings["format"]["config"] = []string{
		"- see " + configLink + " for full list of config options",
		"- \"--config\" flag is optional; partial config is valid; unset config options will fallback to the default config values",
		"- if \"--base64-config\" flag is set, \"--config\" flag expects base64-encoded json string",
		"- if \"--base64-config\" flag is not set, \"--config\" flag expects a valid path to json config file",
	}
	helpStrings["format"]["isBase64Config"] = []string{
		"- if set, \"--config\" flag expects base64-encoded json string",
		"- if not set, \"--config\" flag expects a valid path to json config file",
	}
	helpStrings["format"]["isEmbeddedConfig"] = []string{
		"- gets config embedded within other json files (eg. package.json)",
		"- if set, expects to find config in \"tailwindcss_class_sorter\" key/value",
	}
	helpStrings["format"]["stdin"] = []string{
		"- by piping in base64-encoded string (eg. base64 -w 0 example.html | twcs format --stdin --ext html)",
		"- by streaming in base64-encoded heredoc/herestring (eg:herestring. twcs format --stdin --ext html <<< $(base64 -w 0 example.html))",
		"- if \"region-input\" flag is set, base64-encoded array of regions (strings) to format and outputs to stdout",
		"- if \"region-input\" flag is not set, base64-encoded string to format and outputs to stdout",
		"- if set, paths/globs will be ignored",
		"- if set, \"--ext\" flag must be set",
	}
	helpStrings["format"]["ext"] = []string{
		"- indicates the filetype of the \"--stdin\" flag base64-encoded string (eg. [\"html\"|\"css\"|\"pug\"] in the default \"extensions_regex\" config option)",
		"- \"--ext\" will be used as key to \"extensions_regex\" config option",
		"- if set, \"--stdin\" flag must be set",
	}
	helpStrings["format"]["isRegionInput"] = []string{
		"- indicates \"--stdin\" flag is an array of regions",
		"- if set, \"--stdin\" flag must be set",
		"- if set, \"--stdin\" flag expects base64-encoded json array of regions (strings)",
	}

	/* ---"list" command--- */
	helpStrings["list"] = make(map[string][]string)
	helpStrings["list"]["config"] = []string{
		"- see " + configLink + " for full list of config options",
		"- \"--config\" flag is optional; partial config is valid; unset config options will fallback to the default config values",
		"- if \"--base64-config\" flag is set, \"--config\" flag expects base64-encoded json string",
		"- if \"--base64-config\" flag is not set, \"--config\" flag expects a valid path to json config file",
	}
	helpStrings["list"]["isBase64Config"] = []string{
		"- if set, \"--config\" flag expects base64-encoded json string",
		"- if not set, \"--config\" flag expects a valid path to json config file",
	}
	helpStrings["list"]["isEmbeddedConfig"] = []string{
		"- gets config embedded within other json files (eg. package.json)",
		"- if set, expects to find config in \"tailwindcss_class_sorter\" key/value",
	}
	helpStrings["list"]["isBase64Output"] = []string{
		"- if set, order-list outputs as base64-encoded json string",
		"- if not set, order-list outputs as tabbed json string",
	}
	helpStrings["list"]["showEditedOrder"] = []string{
		"- outputs edited order-list with indices, i.e. \"edit_order\" config option will be implemented to the order-list output",
		"- don't use edited order-list as reference for \"edit_order\" config option; instead, use the unedited order-list as reference by removing \"--edited-order\" flag",
	}

	/* ---output--- */
	var (
		cmd map[string][]string
		sub []string
		err error
	)

	out := strings.Builder{}

	cmd, _ = helpStrings[command]
	sub, _ = cmd[options]

	for _, v := range sub {
		_, err = out.WriteString(padString(linebreak(v, linebreakLength), pad, padLeft, padRight, newlineLeft, newlineRight, toPadChild, parentIdentifier))
		handleError(err, "error strbldr.WriteString", true)
	}

	if toTrim {
		return strings.Trim(out.String(), trimString)
	}

	return out.String()
}

func helpCommand(fullHelp bool) {
	var err error

	/* ---main command--- */
	_, err = fmt.Print( //nolint:forbidigo // ...
		padString([]string{"twcs [subcommands] [options?] [globs?]"}, "", 0, 0, 0, 2, false, ""),
		padString([]string{"Subcommands:"}, "", 0, 0, 0, 1, false, ""),
	)
	handleError(err, "helpCommand fmt.Println", true)

	/* ---"format" command--- */
	_, err = fmt.Print( //nolint:forbidigo // ...
		padString([]string{"format [options] [globs?]"}, "  ", 1, 0, 0, 1, false, ""),
		padString(linebreak("Formats files through multiple space separated paths/globs, or piping in base64-encoded string with the \"--stdin\" flag, or streaming in base64-encoded heredoc/herestring with the \"--stdin\" flag", 127), "  ", 2, 0, 0, 1, false, ""),
	)
	handleError(err, "helpCommand fmt.Println", true)

	if fullHelp {
		_, err = fmt.Print( //nolint:forbidigo // ...
			padString([]string{"Options:"}, "  ", 2, 0, 1, 1, false, ""),
			padString([]string{"--config [string]"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("format", "config", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--base64-config"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("format", "isBase64Config", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--embedded-config"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("format", "isEmbeddedConfig", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--stdin"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("format", "stdin", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--ext [string]"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("format", "ext", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--region-input"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("format", "isRegionInput", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
		)
		handleError(err, "helpCommand fmt.Println", true)
	}

	/* ---"help" command--- */
	_, err = fmt.Print( //nolint:forbidigo // ...
		padString([]string{"help"}, "  ", 1, 0, 1, 1, false, ""),
		padString(linebreak("Display available subcommands and their respective options", 127), "  ", 2, 0, 0, 1, false, ""),
	)
	handleError(err, "helpCommand fmt.Println", true)

	/* ---"list" command--- */
	_, err = fmt.Print( //nolint:forbidigo // ...
		padString([]string{"list [options]"}, "  ", 1, 0, 1, 1, false, ""),
		padString(linebreak("Prints out order-list in prettified json string or in base64-encoded string. The \"--edited-order\" flag will output the order-list with \"edit_order\" config option implemented. Use the unedited order-list as reference for \"edit_order\" config option", 127), "  ", 2, 0, 0, 1, false, ""),
	)
	handleError(err, "helpCommand fmt.Println", true)

	if fullHelp {
		_, err = fmt.Print( //nolint:forbidigo // ...
			padString([]string{"Options:"}, "  ", 2, 0, 1, 1, false, ""),
			padString([]string{"--config [string]"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("list", "config", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--base64-config"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("list", "isBase64Config", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--embedded-config"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("format", "isEmbeddedConfig", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--base64-output"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("list", "isBase64Output", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
			padString([]string{"--edited-order"}, "  ", 3, 0, 0, 1, false, ""),
			printHelp("list", "showEditedOrder", false, "", "  ", 5, 0, 0, 1, true, "- ", 127),
		)
		handleError(err, "helpCommand fmt.Println", true)
	}
}
