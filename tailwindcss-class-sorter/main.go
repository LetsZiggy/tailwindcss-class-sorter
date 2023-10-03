/** command: run
 * git rev-parse --show-toplevel | ( read rootpath; cd $rootpath && go run ./tailwindcss-class-sorter --code <string> --code-ext <string> --config <string> --output-order-list)
 */

/** command: build -> run
 * git rev-parse --show-toplevel | ( read rootpath; cd $rootpath && go build -o $rootpath/dist/tailwindcss-class-sorter ./tailwindcss-class-sorter && ./dist/tailwindcss-class-sorter --code <string> --code-ext <string> --config <string> --output-order-list)
 */

package main

import (
	_ "embed"
	// "encoding/json"
	"flag"
	"fmt"
	"os"
	"time"
	// "github.com/tidwall/jsonc"
)

//go:embed config.json
var configDefault []byte

//go:embed order_list.json
var orderListDefault []byte

func main() {
	fmt.Println()       // ---TO DELETE---
	start := time.Now() // ---TO COMMENT OUT---

	formatFlag := flag.NewFlagSet("format", flag.ExitOnError)
	formatCodeInput := formatFlag.String("code", "",
		padString(helpStrings.format.code[0], "", 0, 0, 0, 1)+
			padString(helpStrings.format.code[1], "", 0, 0, 0, 1)+
			padString(helpStrings.format.code[2], "", 0, 0, 0, 0)+
			padString(helpStrings.format.code[3], "", 0, 0, 0, 0),
	)
	formatCodeExtensionInput := formatFlag.String("code-ext", "",
		padString(helpStrings.format.codeExt[0], "", 0, 0, 0, 1)+
			padString(helpStrings.format.codeExt[1], "  ", 1, 0, 0, 1)+
			padString(helpStrings.format.codeExt[2], "", 0, 0, 0, 1)+
			padString(helpStrings.format.codeExt[3], "", 0, 0, 0, 0),
	)
	formatConfigInput := formatFlag.String("config", "",
		padString(helpStrings.format.config[0], "", 0, 0, 0, 1)+
			padString(helpStrings.format.config[1], "  ", 1, 0, 0, 1)+
			padString(helpStrings.format.config[2], "", 0, 0, 0, 1)+
			padString(helpStrings.format.config[3], "  ", 1, 0, 0, 1)+
			padString(helpStrings.format.config[4], "", 0, 0, 0, 1)+
			padString(helpStrings.format.config[5], "  ", 1, 0, 0, 1)+
			padString(helpStrings.format.config[6], "", 0, 0, 0, 1)+
			padString(helpStrings.format.config[7], "  ", 1, 0, 0, 0),
	)

	helpFlag := flag.NewFlagSet("help", flag.ExitOnError)

	listFlag := flag.NewFlagSet("list", flag.ExitOnError)
	listIsBase64 := listFlag.Bool("base64", false,
		padString(helpStrings.list.base64[0], "", 0, 0, 0, 1)+
			padString(helpStrings.list.base64[1], "", 0, 0, 0, 0),
	)
	listConfigInput := listFlag.String("config", "",
		padString(helpStrings.list.config[0], "", 0, 0, 0, 1)+
			padString(helpStrings.list.config[1], "  ", 1, 0, 0, 1)+
			padString(helpStrings.list.config[2], "", 0, 0, 0, 1)+
			padString(helpStrings.list.config[3], "  ", 1, 0, 0, 1)+
			padString(helpStrings.list.config[4], "", 0, 0, 0, 1)+
			padString(helpStrings.list.config[5], "  ", 1, 0, 0, 1)+
			padString(helpStrings.list.config[6], "", 0, 0, 0, 1)+
			padString(helpStrings.list.config[7], "  ", 1, 0, 0, 0),
	)
	listIsShowEditedOrder := listFlag.Bool("show-edited-order", false,
		padString(helpStrings.list.showEditedOrder[0], "", 0, 0, 0, 1)+
			padString(helpStrings.list.showEditedOrder[1], "", 0, 0, 0, 1)+
			padString(helpStrings.list.showEditedOrder[2], "", 0, 0, 0, 1)+
			padString(helpStrings.list.showEditedOrder[3], "  ", 1, 0, 0, 1)+
			padString(helpStrings.list.showEditedOrder[4], "  ", 1, 0, 0, 0),
	)

	switch {
	case len(os.Args) < 2:
		defer func() {
			os.Exit(1) // ---EXIT PROGRAM---
		}()
		helpCommand(false)

	case os.Args[1] == "format":
		defer func() {
			os.Exit(0) // ---EXIT PROGRAM---
		}()
		formatFlag.Parse(os.Args[2:])
		fmt.Println("format ::", *formatCodeInput)
		fmt.Println("format ::", *formatCodeExtensionInput)
		fmt.Println("format ::", *formatConfigInput)
		if len(*formatCodeInput) == 0 {
			checkArgsOrder()
		}

	case os.Args[1] == "help":
		defer func() {
			os.Exit(0) // ---EXIT PROGRAM---
		}()
		helpFlag.Parse(os.Args[2:])
		helpCommand(true)

	case os.Args[1] == "list":
		defer func() {
			os.Exit(0) // ---EXIT PROGRAM---
		}()
		listFlag.Parse(os.Args[2:])
		listCommand(*listConfigInput, *listIsBase64, *listIsShowEditedOrder)

	default:
		defer func() {
			os.Exit(1) // ---EXIT PROGRAM---
		}()
		helpCommand(false)
	}

	fmt.Printf(">>> tailwind-class-sorter: %v\n", time.Since(start)) // ---TO COMMENT OUT---
	return

	// var defaultOrderMap map[string]TOrder
	// var orderToPrint TOrderIndex

	// json.Unmarshal(jsonc.ToJSON(orderListDefault), &defaultOrderMap)

	// var config TConfig

	// if len(*codeExtensionInput) > 0 {
	// 	configByte := decodeBase64(*configInput, false)
	// 	config = normaliseConfig(configByte)
	// } else {
	// 	configByte := []byte{}

	// 	if len(*configInput) > 0 {
	// 		configByte = getFile(*configInput)
	// 	}

	// 	config = normaliseConfig(configByte)
	// }

	// var order TOrder

	// if config.OrderType == "custom" {
	// 	orderToPrint = orderIndex(config.CustomOrder) // ---Setting global orderToPrint---
	// 	order = normaliseOrder(config.CustomOrder, config.EditOrder)
	// } else {
	// 	var ok bool

	// 	if order, ok = defaultOrderMap[config.OrderType]; !ok {
	// 		order = defaultOrderMap["recess"]
	// 	}

	// 	orderToPrint = orderIndex(order) // ---Setting global orderToPrint---
	// 	order = normaliseOrder(order, config.EditOrder)
	// }

	// if *isOutputOrderIndex {
	// 	defer func() {
	// 		os.Exit(0) // ---EXIT PROGRAM---
	// 	}()

	// 	if len(*codeExtensionInput) > 0 {
	// 		str, err := json.MarshalIndent(orderToPrint, "", "\t")
	// 		handleError(err, "base64 :: \"--output-order-list\" to JSON:", true)

	// 		fmt.Println(encodeBase64(str, true))
	// 	} else {
	// 		prettyPrinter(orderToPrint, "", "\t")
	// 	}

	// 	return
	// }

	// fmt.Println(*codeInput)
	// // var code string
	// // if len(*codeInput) > 0 {
	// // 	code = string(decodeBase64(*codeInput, true))
	// // } else {
	// // 	// ---TODO::handle globs/filepath args---

	// // 	err = makeError("\"--code\" flag not set :: only string formatting is currently supported")
	// // 	handleError(err, "code flag", true)
	// // }

	// // order = TOrder{}
	// // fmt.Print(order, "\n\n")
	// // fmt.Print(code, "\n\n")
}
