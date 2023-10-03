package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"slices"
	"strings"

	"github.com/tidwall/jsonc"
)

func padString(str, pad string, padLeft, padRight, newlineLeft, newlineRight int) string {
	res := ""
	for newlineLeft > 0 {
		res += "\n"
		newlineLeft--
	}
	for padLeft > 0 {
		res += pad
		padLeft--
	}
	res += str
	for padRight > 0 {
		res += pad
		padRight--
	}
	for newlineRight > 0 {
		res += "\n"
		newlineRight--
	}
	return res
}

func checkArgsOrder() {
	length := len(os.Args)
	nonFlagsIndex := flag.NArg()
	args := strings.Join(os.Args[length-nonFlagsIndex:], " ")
	if strings.Contains(args, " -") {
		err := makeError("place flags before globs/filepaths >>> " + args)
		handleError(err, "func checkArgsOrder", true)
	}
}

func mapKeys[K comparable, V any](m map[K]V) []K {
	keys := make([]K, len(m))
	i := 0
	for k := range m {
		keys[i] = k
		i++
	}
	return keys
}

func makeError(str string) error {
	return errors.New(str)
}

func handleError(err error, str string, toPanic bool) {
	logger := log.New(os.Stderr, "", 1)
	if err != nil {
		if len(str) > 0 {
			err = errors.Join(makeError(" --- "+str+" --- "), err)
		}
		switch toPanic {
		case true:
			logger.Panicln(err)
		case false:
			logger.Println(err)
		}
	}
}

func decodeBase64(input string, panicIfEmpty bool) []byte {
	if panicIfEmpty && len(input) == 0 {
		err := makeError("base64 is empty")
		handleError(err, "reading base64", true)
	}
	out, err := base64.StdEncoding.DecodeString(input)
	handleError(err, "decoding base64", true)
	return out
}

func encodeBase64(input []byte, panicIfEmpty bool) string {
	if panicIfEmpty && len(input) == 0 {
		err := makeError("input is empty")
		handleError(err, "writing base64", true)
	}
	return base64.StdEncoding.EncodeToString(input)
}

func getFile(path string, panicIfInvalid bool) []byte {
	content, err := os.ReadFile(path)
	handleError(err, "getFile<"+path+">", panicIfInvalid)
	return content
}

func normaliseConfig(input []byte) TConfig {
	var config TConfig
	json.Unmarshal(jsonc.ToJSON(configDefault), &config)
	err := json.Unmarshal(jsonc.ToJSON(input), &config)
	handleError(err, "get config(base64): json.Unmarshal :: \"--config\" not valid. Reverting to default values.", false)
	/* NonTailwindcssPlacement */
	if !slices.Contains([]string{"front", "back"}, config.NonTailwindcssPlacement) {
		config.NonTailwindcssPlacement = "front"
	}
	/* OrderType */
	if !slices.Contains([]string{"recess", "concentric", "smacss", "custom"}, config.OrderType) {
		config.OrderType = "recess"
	}
	/* BreakpointGrouping */
	if !slices.Contains([]string{"style", "breakpoint"}, config.BreakpointGrouping) {
		config.BreakpointGrouping = "style"
	}
	/* ExtensionsRegex */
	for _, v := range mapKeys(config.ExtensionsRegex) {
		extension, _ := config.ExtensionsRegex[v]
		if extension.ConditionalSplitCharacter == "" {
			extension.ConditionalSplitCharacter = "?"
		}
		if !slices.Contains([]string{"before", "after"}, extension.ConditionalClassLocation) {
			extension.ConditionalClassLocation = "after"
		}
		if extension.Separator == "" {
			extension.Separator = " "
		}
		config.ExtensionsRegex[v] = extension
	}
	/* EditOrder.Amend */
	if len(config.EditOrder.Amend) > 0 {
		/* Ensure "Position" is "start" | "end" */
		for k := range config.EditOrder.Amend {
			if !slices.Contains([]string{"start", "end"}, config.EditOrder.Amend[k].Position) {
				config.EditOrder.Amend[k].Position = "end"
			}
		}
	}
	/* EditOrder.Append */
	if len(config.EditOrder.Append) > 0 {
		/* Ensure "Position" is "after" | "before" */
		for k := range config.EditOrder.Append {
			if !slices.Contains([]string{"after", "before"}, config.EditOrder.Append[k].Position) {
				config.EditOrder.Append[k].Position = "after"
			}
		}
		if len(config.EditOrder.Append) > 1 {
			/* Sort EditOrder.Append --- Sort higher "AppendOrder" first */
			slices.SortStableFunc(config.EditOrder.Append, func(a, b TAppend) int {
				switch {
				case a.AppendOrder < b.AppendOrder:
					return 1
				case a.AppendOrder > b.AppendOrder:
					return -1
				default:
					return 0
				}
			})
			/* Sort EditOrder.Append - Sort "after" then "before" */
			slices.SortStableFunc(config.EditOrder.Append, func(a, b TAppend) int {
				aRune := a.Position[0]
				bRune := b.Position[0]
				switch {
				case aRune < bRune:
					return -1
				case aRune > bRune:
					return 1
				default:
					return 0
				}
			})
			/* Sort EditOrder.Append - Sort higher "GroupIndex" first */
			slices.SortStableFunc(config.EditOrder.Append, func(a, b TAppend) int {
				switch {
				case a.GroupIndex < b.GroupIndex:
					return 1
				case a.GroupIndex > b.GroupIndex:
					return -1
				default:
					return 0
				}
			})
		}
	}
	return config
}

func orderIndex(order TOrder) TOrderIndex {
	list := make(TOrderIndex, len(order))
	for k, v := range order {
		list[k] = TOrderGroupIndex{k, v.GroupName, v.Regex}
	}
	return list
}

func normaliseOrder(order TOrder, editOrder TEditOrder) TOrder {
	/* EditOrder.Overwrite */
	for _, v := range editOrder.Overwrite {
		order[v.GroupIndex].Regex = v.RegexList
	}
	/* EditOrder.Amend */
	for _, v := range editOrder.Amend {
		switch v.Position {
		case "start":
			order[v.GroupIndex].Regex = append(v.RegexList, order[v.GroupIndex].Regex...)
		case "end":
			order[v.GroupIndex].Regex = append(order[v.GroupIndex].Regex, v.RegexList...)
		}
	}
	/* EditOrder.Append */
	for _, v := range editOrder.Append {
		var appendIndex int
		switch v.Position {
		case "before":
			appendIndex = v.GroupIndex - 1
		case "after":
			appendIndex = v.GroupIndex + 1
		}
		switch {
		case appendIndex < 0:
			order = append(TOrder{TOrderGroup{v.GroupName, v.RegexList}}, order...)
		default:
			order = append(order[:appendIndex], append(TOrder{TOrderGroup{v.GroupName, v.RegexList}}, order[appendIndex:]...)...)
		}
	}
	return order
}

func prettyPrinter[T any](input T, prefix, indent string) {
	pretty, err := json.MarshalIndent(input, prefix, indent)
	handleError(err, "prettyPrinter:", true)
	fmt.Printf("%s\n", string(pretty))
}
