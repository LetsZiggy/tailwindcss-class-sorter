package main

import (
	"bufio"
	_ "embed"
	"flag"
	"os"
	"strings"
)

// import "time"

var (
	//go:embed dist/config.min.json
	configDefault []byte

	//go:embed dist/order_list.min.json
	orderListDefault []byte
)

func main() {
	/* --- COMMENT OUT FOR RELEASE; FOR DEV ONLY; --- */
	// start := time.Now()

	/* ---"format" command--- */
	formatFlag := flag.NewFlagSet("format", flag.ExitOnError)
	formatConfigInput := formatFlag.String("config", "", printHelp("format", "config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatIsBase64Config := formatFlag.Bool("base64-config", false, printHelp("format", "isBase64Config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatIsEmbeddedConfig := formatFlag.Bool("embedded-config", false, printHelp("format", "isEmbeddedConfig", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatStdinInput := formatFlag.Bool("stdin", false, printHelp("format", "stdin", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatExtensionInput := formatFlag.String("ext", "", printHelp("format", "ext", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatIsRegionInput := formatFlag.Bool("region-input", false, printHelp("format", "isRegionInput", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))

	/* ---"help" command--- */
	helpFlag := flag.NewFlagSet("help", flag.ExitOnError)

	/* ---"list" command--- */
	listFlag := flag.NewFlagSet("list", flag.ExitOnError)
	listConfigInput := listFlag.String("config", "", printHelp("list", "config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsBase64Config := listFlag.Bool("base64-config", false, printHelp("list", "isBase64Config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsEmbeddedConfig := listFlag.Bool("embedded-config", false, printHelp("list", "isEmbeddedConfig", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsBase64Output := listFlag.Bool("base64-output", false, printHelp("list", "isBase64Output", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsEditedOrder := listFlag.Bool("edited-order", false, printHelp("list", "showEditedOrder", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))

	var err error

	switch {
	case len(os.Args) < 2:
		defer os.Exit(1)

		helpCommand(false)

	case os.Args[1] == "format":
		defer os.Exit(0)

		err = formatFlag.Parse(os.Args[2:])
		handleError(err, "main formatFlag.Parse", true)

		formatCodeInput := new(string)
		if *formatStdinInput {
			scanner := bufio.NewScanner(os.Stdin)
			builder := strings.Builder{}

			for scanner.Scan() {
				_, err := builder.WriteString(scanner.Text())
				handleError(err, "main os.Stdin", true)
			}

			*formatCodeInput = builder.String()
		}

		codeInputLen := len(*formatCodeInput)
		extensionInputLen := len(*formatExtensionInput)
		filepaths := formatFlag.Args()
		args := strings.Join(filepaths, " ")

		switch {
		/* ---check base64 input--- */
		case (codeInputLen > 0 && extensionInputLen == 0):
			handleError(
				makeError("\"--stdin\" and \"--ext\" must be set together"),
				"flags error",
				true,
			)

		case (codeInputLen == 0 && extensionInputLen > 0):
			handleError(
				makeError("\"--stdin\" and \"--ext\" must be set together"),
				"flags error",
				true,
			)

		/* ---handle base64 input--- */
		case codeInputLen > 0 && extensionInputLen > 0:
			formatCommand(*formatIsBase64Config, *formatIsEmbeddedConfig, *formatIsRegionInput, *formatCodeInput, *formatExtensionInput, []string{}, *formatConfigInput)

		/* ---check globs/filepaths input - no globs/filepaths--- */
		case args == "":
			handleError(
				makeError("no globs/filepaths provided"),
				"args error",
				true,
			)

		/* ---check globs/filepaths input - flags after globs/filepaths--- */
		case strings.Contains(args, " -"):
			handleError(
				makeError("place flags before globs/filepaths: "+args),
				"args error",
				true,
			)

		/* ---handles globs/filepaths input--- */
		default:
			formatCommand(*formatIsBase64Config, *formatIsEmbeddedConfig, false, "", "", filepaths, *formatConfigInput)
		}

	case os.Args[1] == "help":
		defer os.Exit(0)

		err = helpFlag.Parse(os.Args[2:])
		handleError(err, "main helpFlag.Parse", true)

		helpCommand(true)

	case os.Args[1] == "list":
		defer os.Exit(0)

		err = listFlag.Parse(os.Args[2:])
		handleError(err, "main listFlag.Parse", true)

		listCommand(*listIsBase64Config, *listIsEmbeddedConfig, *listIsBase64Output, *listConfigInput, *listIsEditedOrder)

	default:
		defer os.Exit(1)

		helpCommand(false)
	}

	/* --- COMMENT OUT FOR RELEASE; FOR DEV ONLY; --- */
	// println(">>> tailwind-class-sorter:", time.Since(start).String(), "\n")
}
