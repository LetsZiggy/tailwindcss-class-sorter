package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"slices"
	"strings"

	"github.com/tidwall/jsonc"
)

func padString(strArray []string, pad string, padLeft, padRight, newlineLeft, newlineRight int, toPadChild bool, parentIdentifier string) string {
	out := ""

	for _, v := range strArray {
		pl := padLeft
		pr := padRight
		nll := newlineLeft
		nlr := newlineRight
		for nll > 0 {
			out += "\n"
			nll--
		}

		for pl > 0 {
			out += pad
			pl--
		}

		if toPadChild && strings.Index(v, parentIdentifier) != 0 {
			out += pad
		}

		out += v

		for pr > 0 {
			out += pad
			pr--
		}

		for nlr > 0 {
			out += "\n"
			nlr--
		}
	}

	return out
}

func linebreak(input string, length int) []string {
	out := []string{}
	buffer := make([]rune, length*2)
	lastIndex := len(input) - 1
	count := 0
	isNotSpace := false

	for k, v := range []rune(input) {
		if k == lastIndex {
			buffer[count] = v
			out = append(out, string(buffer))
			clear(buffer)
			count = 0
			isNotSpace = false
			continue
		}

		if count >= length {
			if string(v) == " " || string(v) == "\t" {
				out = append(out, string(buffer))
				clear(buffer)
				count = 0
				isNotSpace = false
				continue
			}

			isNotSpace = true
		}

		if count < length || isNotSpace {
			switch {
			case count > 0:
				buffer[count] = v

			case count == 0 && string(v) != " " && string(v) != "\t":
				buffer[count] = v
			}

			count++

			continue
		}
	}

	return out
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

func removeSliceIndex[TS ~[]T, T any](s TS, index int) TS {
	out := make([]T, 0)
	out = append(out, s[:index]...)
	out = append(out, s[index+1:]...)

	return out
}

func makeError(str string) error {
	return errors.New(str)
}

func handleError(err error, str string, toPanic bool) {
	if err != nil {
		logger := log.New(os.Stderr, "", 1)
		fatal := ""

		if toPanic {
			fatal = "::Fatal::"
		}

		if len(str) > 0 {
			err = errors.Join(makeError("\n"+fatal+str), err)
		}

		switch toPanic {
		case true:
			logger.Panicln(err)

		case false:
			logger.Println(err)
		}
	}
}

func decodeBase64(input string, toOutputErr, panicIfEmpty bool) ([]byte, bool) {
	var (
		out []byte
		err error
	)

	ok := true

	if len(input) == 0 && toOutputErr {
		ok = false

		err := makeError("base64 is empty")
		handleError(err, "reading base64", panicIfEmpty)
	}

	if out, err = base64.StdEncoding.DecodeString(input); err != nil {
		ok = false

		if toOutputErr {
			handleError(err, "error decoding base64", true)
		}
	}

	if !ok {
		out = []byte{}
	}

	return out, ok
}

func encodeBase64(input []byte, toOutputErr, panicIfEmpty bool) string {
	if len(input) == 0 && toOutputErr {
		err := makeError("input is empty")
		handleError(err, "writing base64", panicIfEmpty)
	}

	return base64.StdEncoding.EncodeToString(input)
}

func readFile(filepath string, toOutputErr, panicIfInvalid bool) ([]byte, bool) {
	var (
		out []byte
		err error
	)

	ok := true

	if out, err = os.ReadFile(filepath); err != nil {
		ok = false

		if toOutputErr {
			handleError(err, "reading file ["+filepath+"]", panicIfInvalid)
		}
	}

	if !ok {
		out = []byte{}
	}

	return out, ok
}

func writeFile(input []byte, filepath string, toOutputErr, panicIfEmpty, panicIfInvalid bool) {
	var err error
	if len(input) == 0 && toOutputErr {
		err = makeError("input is empty")
		handleError(err, "writing file ["+filepath+"]", panicIfEmpty)
	}

	if err = os.WriteFile(filepath, input, 0o644); err != nil {
		handleError(err, "writing file ["+filepath+"]", panicIfInvalid)
	}
}

func getUserConfig(input string, isBase64 bool) []byte {
	var (
		out []byte
		ok  bool
	)

	switch isBase64 {
	case true:
		out, ok = decodeBase64(input, false, false)

	case false:
		out, ok = readFile(input, false, false)
	}

	if !ok {
		out = []byte{}
	}

	return out
}

func normaliseConfig(input []byte, isEmbedded, toOutputErr bool) TConfigInput {
	var (
		embeddedConfigInput TEmbeddedConfigInput
		configInput         TConfigInput
		err                 error
		index               int
		groupStarArr        []string
		peerStarArr         []string
		sl                  []string
		bl                  []byte
	)

	json.Unmarshal(jsonc.ToJSON(configDefault), &configInput)

	switch isEmbedded {
	case true:
		if err = json.Unmarshal(jsonc.ToJSON(input), &embeddedConfigInput); err != nil && toOutputErr {
			handleError(err, "normalise embedded config: json.Unmarshal :: \"--config\" not valid. Reverting to default values.", false)
		}

		bl, err = json.Marshal(embeddedConfigInput.TailwindcssClassSorter)
		handleError(err, "normalise embedded config: json.Marshal", true)

		if err = json.Unmarshal(jsonc.ToJSON(bl), &configInput); err != nil && toOutputErr {
			handleError(err, "get config: json.Unmarshal :: \"--config\" not valid. Reverting to default values.", false)
		}

	case false:
		if err = json.Unmarshal(jsonc.ToJSON(input), &configInput); err != nil && toOutputErr {
			handleError(err, "get config: json.Unmarshal :: \"--config\" not valid. Reverting to default values.", false)
		}
	}

	/* ---expand variantOrdering (group-* | peer-*)--- */
	for _, v := range configInput.VariantOrdering {
		switch {
		case strings.Contains(v, "min-") || strings.Contains(v, "max-"):
			fallthrough

		case !strings.Contains(v, "-*") && !strings.Contains(v, "aria-"):
			groupStarArr = append(groupStarArr, "group-"+v)
			peerStarArr = append(peerStarArr, "peer-"+v)
		}
	}

	/* ---expand group-*--- */
	index = slices.Index(configInput.VariantOrdering, "group-*")
	sl = append(groupStarArr, configInput.VariantOrdering[index:]...)
	configInput.VariantOrdering = append(configInput.VariantOrdering[:index], sl...)

	/* ---expand peer-*--- */
	index = slices.Index(configInput.VariantOrdering, "peer-*")
	sl = append(peerStarArr, configInput.VariantOrdering[index:]...)
	configInput.VariantOrdering = append(configInput.VariantOrdering[:index], sl...)

	/* ---NonTailwindcssPlacement--- */
	if !slices.Contains([]string{"front", "back"}, configInput.NonTailwindcssPlacement) {
		configInput.NonTailwindcssPlacement = "front"
	}

	/* ---OrderType--- */
	if !slices.Contains([]string{"recess", "concentric", "custom"}, configInput.OrderType) {
		configInput.OrderType = "recess"
	}

	/* ---BreakpointGrouping--- */
	if !slices.Contains([]string{"style", "breakpoint"}, configInput.BreakpointGrouping) {
		configInput.BreakpointGrouping = "style"
	}

	/* ---ExtensionsRegex--- */
	for _, v := range mapKeys(configInput.ExtensionsRegex) {
		extension, _ := configInput.ExtensionsRegex[v]

		if extension.ConditionalSplitCharacter == "" {
			extension.ConditionalSplitCharacter = "?"
		}

		if !slices.Contains([]string{"before", "after"}, extension.ConditionalClassLocation) {
			extension.ConditionalClassLocation = "after"
		}

		if extension.Separator == "" {
			extension.Separator = " "
		}

		configInput.ExtensionsRegex[v] = extension
	}

	/* ---EditOrder.Amend--- */
	if len(configInput.EditOrder.Amend) > 0 {
		/* ---ensure "Position" is "start" | "end"--- */
		for k := range configInput.EditOrder.Amend {
			if !slices.Contains([]string{"start", "end"}, configInput.EditOrder.Amend[k].Position) {
				configInput.EditOrder.Amend[k].Position = "end"
			}
		}
	}

	/* ---EditOrder.Append--- */
	if len(configInput.EditOrder.Append) > 0 {
		/* ---ensure "Position" is "after" | "before"--- */
		for k := range configInput.EditOrder.Append {
			if !slices.Contains([]string{"after", "before"}, configInput.EditOrder.Append[k].Position) {
				configInput.EditOrder.Append[k].Position = "after"
			}
		}

		if len(configInput.EditOrder.Append) > 1 {
			/* ---sort EditOrder.Append --- Sort higher "AppendOrder" first--- */
			slices.SortStableFunc(configInput.EditOrder.Append, func(a, b TAppend) int {
				switch {
				case a.AppendOrder < b.AppendOrder:
					return 1

				case a.AppendOrder > b.AppendOrder:
					return -1

				default:
					return 0
				}
			})

			/* ---sort EditOrder.Append - Sort "after" then "before"--- */
			slices.SortStableFunc(configInput.EditOrder.Append, func(a, b TAppend) int {
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

			/* ---sort EditOrder.Append - Sort higher "GroupIndex" first--- */
			slices.SortStableFunc(configInput.EditOrder.Append, func(a, b TAppend) int {
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

	return configInput
}

func orderIndex(order TOrderList) TOrderIndex {
	list := make(TOrderIndex, len(order))

	for k, v := range order {
		list[k] = TOrderGroupIndex{k, v.GroupName, v.Regex}
	}

	return list
}

func normaliseOrder(order TOrderList, editOrder TEditOrder) TOrderList {
	/* ---EditOrder.Overwrite--- */
	for _, v := range editOrder.Overwrite {
		order[v.GroupIndex].Regex = v.Regex
	}

	/* ---EditOrder.Amend--- */
	for _, v := range editOrder.Amend {
		switch v.Position {
		case "start":
			order[v.GroupIndex].Regex = append(v.Regex, order[v.GroupIndex].Regex...)

		case "end":
			order[v.GroupIndex].Regex = append(order[v.GroupIndex].Regex, v.Regex...)
		}
	}

	/* ---EditOrder.Append--- */
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
			order = append(TOrderList{TOrderGroup{v.GroupName, v.Regex}}, order...)

		default:
			order = append(order[:appendIndex], append(TOrderList{TOrderGroup{v.GroupName, v.Regex}}, order[appendIndex:]...)...)
		}
	}

	return order
}

func prettyPrinter[T any](input T, prefix, indent string) {
	pretty, err := json.MarshalIndent(input, prefix, indent)
	handleError(err, "prettyPrinter:", true)

	fmt.Printf("%s\n", string(pretty))
}
