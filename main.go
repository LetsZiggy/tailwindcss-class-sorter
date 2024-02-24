package main

import (
	_ "embed"
	"flag"
	"os"
	"strings"
	// "time"
)

//go:embed dist/config.min.json
var configDefault []byte

//go:embed dist/order_list.min.json
var orderListDefault []byte

func main() {
	/* ---TO COMMENT OUT--- */
	// start := time.Now()

	/* ---"format" command--- */
	formatFlag := flag.NewFlagSet("format", flag.ExitOnError)
	formatIsBase64Config := formatFlag.Bool("base64-config", false, printHelp("format", "isBase64Config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatIsEmbeddedConfig := formatFlag.Bool("embedded-config", false, printHelp("format", "isEmbeddedConfig", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatIsRegionInput := formatFlag.Bool("region-input", false, printHelp("format", "isRegionInput", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatCodeInput := formatFlag.String("code", "", printHelp("format", "code", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatCodeExtensionInput := formatFlag.String("code-ext", "", printHelp("format", "codeExt", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatConfigInput := formatFlag.String("config", "", printHelp("format", "config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))

	/* ---"help" command--- */
	helpFlag := flag.NewFlagSet("help", flag.ExitOnError)

	/* ---"list" command--- */
	listFlag := flag.NewFlagSet("list", flag.ExitOnError)
	listIsBase64Config := listFlag.Bool("base64-config", false, printHelp("list", "isBase64Config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsEmbeddedConfig := listFlag.Bool("embedded-config", false, printHelp("list", "isEmbeddedConfig", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsBase64Output := listFlag.Bool("base64-output", false, printHelp("list", "isBase64Output", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listConfigInput := listFlag.String("config", "", printHelp("list", "config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsEditedOrder := listFlag.Bool("edited-order", false, printHelp("list", "showEditedOrder", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))

	switch {
	case len(os.Args) < 2:
		defer func() {
			os.Exit(1)
		}()

		helpCommand(false)

	case os.Args[1] == "format":
		defer func() {
			os.Exit(0)
		}()

		formatFlag.Parse(os.Args[2:])
		codeInputLen := len(*formatCodeInput)
		codeExtensionInputLen := len(*formatCodeExtensionInput)
		filepaths := formatFlag.Args()
		args := strings.Join(filepaths, " ")

		switch {
		/* ---check base64 input--- */
		case (codeInputLen > 0 && codeExtensionInputLen == 0):
			err := makeError("\"--code\" and \"--code-ext\" must be set together")
			handleError(err, "flags error", true)

		case (codeInputLen == 0 && codeExtensionInputLen > 0):
			err := makeError("\"--code\" and \"--code-ext\" must be set together")
			handleError(err, "flags error", true)

		/* ---handle base64 input--- */
		case codeInputLen > 0 && codeExtensionInputLen > 0:
			formatCommand(*formatIsBase64Config, *formatIsEmbeddedConfig, *formatIsRegionInput, *formatCodeInput, *formatCodeExtensionInput, []string{}, *formatConfigInput)

		/* ---check globs/filepaths input - no globs/filepaths--- */
		case len(args) == 0:
			err := makeError("no globs/filepaths provided")
			handleError(err, "args error", true)

		/* ---check globs/filepaths input - flags after globs/filepaths--- */
		case strings.Contains(args, " -"):
			err := makeError("place flags before globs/filepaths: " + args)
			handleError(err, "args error", true)

		/* ---handles globs/filepaths input--- */
		default:
			formatCommand(*formatIsBase64Config, *formatIsEmbeddedConfig, false, "", "", filepaths, *formatConfigInput)

		}

	case os.Args[1] == "help":
		defer func() {
			os.Exit(0)
		}()

		helpFlag.Parse(os.Args[2:])
		helpCommand(true)

	case os.Args[1] == "list":
		defer func() {
			os.Exit(0)
		}()

		listFlag.Parse(os.Args[2:])
		listCommand(*listIsBase64Config, *listIsEmbeddedConfig, *listIsBase64Output, *listConfigInput, *listIsEditedOrder)

	default:
		defer func() {
			os.Exit(1)
		}()

		helpCommand(false)
	}

	/* ---TO COMMENT OUT--- */
	// println(">>> tailwind-class-sorter:", time.Since(start).String(), "\n")

	return
}
