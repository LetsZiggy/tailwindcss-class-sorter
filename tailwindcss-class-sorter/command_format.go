package main

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	re "github.com/dlclark/regexp2"
	"github.com/tidwall/jsonc"
)

func format(filepath, extension, code string, isCodeInput bool, config TConfig, orderList TOrderList, groupNameList []string, wg *sync.WaitGroup, isAsync bool) {
	if isAsync {
		defer wg.Done()
	}

	var (
		matches    *re.Match
		regionList TRegionList
	)

	re.DefaultMatchTimeout = time.Second * 5

	/* ---define special cases--- */
	specialCases := TSpecialCases{
		PositionStyle: TSpecialCase{
			[]string{"static", "absolute", "relative", "fixed", "sticky"},
			[]int{},
			-1,
		},
		DisplayStyle: TSpecialCase{
			[]string{"hidden", "inline", "block", "flex", "grid", "table", "contents", "flow", "list"},
			[]int{},
			-1,
		},
	}

	for _, v := range specialCases.PositionStyle.Classes {
		i := slices.Index(groupNameList, v)
		specialCases.PositionStyle.Index = append(specialCases.PositionStyle.Index, i)
	}

	specialCases.PositionStyle.Minimum = slices.Min(specialCases.PositionStyle.Index)

	for _, v := range specialCases.DisplayStyle.Classes {
		i := slices.Index(groupNameList, v)
		specialCases.DisplayStyle.Index = append(specialCases.DisplayStyle.Index, i)
	}

	specialCases.DisplayStyle.Minimum = slices.Min(specialCases.DisplayStyle.Index)

	/* ---define default regex(es)--- */
	reRegion := re.MustCompile(config.ExtensionRegex.Region, re.None)
	reClass := re.MustCompile(config.ExtensionRegex.Class, re.None)
	reClassStartCharacter := re.MustCompile("^[a-zA-Z!\\-\\[\\]]", re.None)
	// reTemplateClass := re.MustCompile("(\"[^\"]*?\")|('[^']*?')|(`[^`]*?`)", re.None)
	// reTWVariant := re.MustCompile(":[a-zA-Z!-]", re.None)

	/* ---find regions and region lengths--- */
	matches, _ = reRegion.FindStringMatch(code)

	for matches != nil {
		regionList = append(regionList, TRegion{matches.String(), matches.Capture.Index, matches.Capture.Length})
		matches, _ = reRegion.FindNextMatch(matches)
	}

	/* ---format in reverse order of found matches--- */
	regionListIndex := len(regionList) - 1

	for regionListIndex >= 0 {
		var (
			classList                []string                = []string{}
			groupedWeightedClassList []TGroupedWeightedClass = []TGroupedWeightedClass{}
		)

		region := regionList[regionListIndex]
		regionListIndex -= 1

		/* ---find css classes in region --- */
		matches, _ = reClass.FindStringMatch(region.Classes)

		for matches != nil {
			classList = append(classList, matches.String())
			matches, _ = reClass.FindNextMatch(matches)
		}

		/* ---initialise weighted classes group--- */
		for _, groupName := range groupNameList {
			groupedWeightedClassList = append(groupedWeightedClassList, TGroupedWeightedClass{
				GroupName:         groupName,
				WeightedClassList: []TWeightedClass{},
			})
		}

		/* ---get css class order weight and add in groupedWeightedClassList--- */
		for _, className := range classList {
			// className = strings.Trim(className, " \t\n")
			classNameSorting := className

			// if matches, _ = reClassStartCharacter.FindStringMatch(classNameSorting); len(matches.String()) < 1 {
			// }
			b, _ := reClassStartCharacter.MatchString(classNameSorting)
			if !b {
				fmt.Println(classNameSorting)
			}
			// fmt.Println(className) /* ---TO DELETE--- */
		}

		// prettyPrinter(classList, "", "\t")    /* ---TO DELETE--- */
	}

	/* ---print to stdout | write to file--- */
	/*
		switch isCodeInput {
		case true:
			fmt.Println(encodeBase64([]byte(code), true, true))
		case false:
			writeFile([]byte(code), filepath, true, false, false)
		}
	*/
}

func formatCommand(isBase64Config bool, code, codeExt string, filepaths []string, configRaw string) {
	var (
		defaultOrderMap map[string]TOrderList
		codeByte        []byte
		config          TConfig
		configByte      []byte
		configInput     TConfigInput
		err             error
		extensionRegex  TExtensionRegex
		ok              bool
		orderList       TOrderList
		groupNameList   []string = []string{}
		wg              sync.WaitGroup
	)
	// get config/order
	json.Unmarshal(jsonc.ToJSON(orderListDefault), &defaultOrderMap)
	configByte = getUserConfig(configRaw, isBase64Config)
	configInput = normaliseConfig(configByte, false)

	switch configInput.OrderType {
	case "custom":
		orderList = normaliseOrder(configInput.CustomOrder, configInput.EditOrder)

	default:
		if orderList, ok = defaultOrderMap[configInput.OrderType]; !ok {
			orderList = defaultOrderMap["recess"]
		}
		orderList = normaliseOrder(orderList, configInput.EditOrder)
	}

	for _, v := range orderList {
		groupNameList = append(groupNameList, v.GroupName)
	}

	// handle code/filepaths
	filepathsLength := len(filepaths)

	switch {
	// handle code
	case len(code) > 0 && len(codeExt) > 0:
		if extensionRegex, ok = configInput.ExtensionsRegex[codeExt]; !ok {
			err = makeError("cannot find \"--code-ext\" in \"extensions_regex\" config option")
			handleError(err, "flags error", true)
		}
		config = TConfig{
			NonTailwindcssPlacement: configInput.NonTailwindcssPlacement,
			ExtensionRegex:          extensionRegex,
			OrderType:               configInput.OrderType,
			BreakpointGrouping:      configInput.BreakpointGrouping,
			VariantOrdering:         configInput.VariantOrdering,
			BreakpointOrder:         configInput.BreakpointOrder,
		}
		format("", codeExt, code, true, config, orderList, groupNameList, &wg, false)

	// handle files
	case filepathsLength > 0:
		for _, v := range filepaths {
			if strings.Contains(v, "*") {
				err = makeError("invalid glob/filepath: " + v)
				handleError(err, "glob/filepath error", false)
				continue
			}
			extension := filepath.Ext(v)[1:]
			if codeByte, ok = readFile(v, true, false); !ok {
				err = makeError("cannot read file: " + v)
				handleError(err, "file error", false)
				continue
			}
			if extensionRegex, ok = configInput.ExtensionsRegex[extension]; !ok {
				err = makeError("cannot find file type in \"extensions_regex\" config option")
				handleError(err, "file error", false)
				continue
			}
			config = TConfig{
				NonTailwindcssPlacement: configInput.NonTailwindcssPlacement,
				ExtensionRegex:          extensionRegex,
				OrderType:               configInput.OrderType,
				BreakpointGrouping:      configInput.BreakpointGrouping,
				VariantOrdering:         configInput.VariantOrdering,
				BreakpointOrder:         configInput.BreakpointOrder,
			}
			switch filepathsLength {
			case 1:
				format(v, extension, string(codeByte), false, config, orderList, groupNameList, &wg, false)

			default:
				wg.Add(1)
				go format(v, extension, string(codeByte), false, config, orderList, groupNameList, &wg, true)
			}
		}

		wg.Wait()
	}
}
