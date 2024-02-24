package main

import (
	re "github.com/dlclark/regexp2/v2"
)

type (
	// TExtensionRegex
	TExtensionRegex struct {
		Region                    string `json:"region"`
		Class                     string `json:"class"`
		ConditionalSplitCharacter string `json:"conditional_split_character,omitempty"                        default:"?"`
		ConditionalClassLocation  string `json:"conditional_class_location,omitempty"  options:"before|after" default:"after"`
		Separator                 string `json:"separator,omitempty"                                          default:" "`
	}

	// TOverwrite
	TOverwrite struct {
		Regex      []string `json:"regex"`
		GroupIndex int      `json:"group_index"`
	}

	// TAmend
	TAmend struct {
		Position   string   `json:"position"    options:"start|end" default:"end"`
		Regex      []string `json:"regex"`
		GroupIndex int      `json:"group_index"`
	}

	// TAppend
	TAppend struct {
		GroupName   string   `json:"group_name"`
		Position    string   `json:"position"     options:"before|after" default:"after"`
		Regex       []string `json:"regex"`
		GroupIndex  int      `json:"group_index"`
		AppendOrder int      `json:"append_order"`
	}

	// TEditOrder
	TEditOrder struct {
		Overwrite []TOverwrite `json:"overwrite"`
		Amend     []TAmend     `json:"amend"`
		Append    []TAppend    `json:"append"`
	}

	// TOrderGroup
	TOrderGroup struct {
		GroupName string   `json:"group_name"`
		Regex     []string `json:"regex"`
	}

	// TOrderList
	TOrderList []TOrderGroup

	// TOrderGroupIndex
	TOrderGroupIndex struct {
		GroupName string   `json:"group_name"`
		Regex     []string `json:"regex"`
		Index     int      `json:"index"`
	}

	// TOrderIndex
	TOrderIndex []TOrderGroupIndex

	// TEmbeddedConfigInput
	TEmbeddedConfigInput struct {
		TailwindcssClassSorter TConfigInput `json:"tailwindcss_class_sorter"`
	}

	// TConfigInput
	TConfigInput struct {
		NonTailwindcssPlacement string                     `json:"non_tailwindcss_placement,omitempty" options:"front|back"                      default:"front"`
		ExtensionsRegex         map[string]TExtensionRegex `json:"extensions_regex,omitempty"`
		OrderType               string                     `json:"order_type,omitempty"                options:"recess|concentric|smacss|custom" default:"recess"`
		EditOrder               TEditOrder                 `json:"edit_order"`
		BreakpointGrouping      string                     `json:"breakpoint_grouping,omitempty"       options:"style|breakpoint"                default:"style"`
		VariantOrdering         []string                   `json:"variant_ordering,omitempty"`
		BreakpointOrder         []string                   `json:"breakpoint_order,omitempty"`
		CustomOrder             TOrderList                 `json:"custom_order,omitempty"`
	}

	// TConfig
	TConfig struct {
		nonTailwindcssPlacement         string
		extensionRegex                  TExtensionRegex
		orderType                       string //nolint:unused // ...
		breakpointGrouping              string
		variantOrdering                 []string
		breakpointOrder                 []string
		breakpointOrderWeightMultiplier int
	}

	// TRegexps
	TRegexps struct {
		classStartCharacter  *re.Regexp
		conditionalClassName *re.Regexp
		variant              *re.Regexp
		region               *re.Regexp
		class                *re.Regexp
		before               *re.Regexp
		after                *re.Regexp
	}

	// TSpecialCase
	TSpecialCase struct {
		classes []string
		index   []int
		minimum int
	}

	// TSpecialCases
	TSpecialCases struct {
		positionStyle TSpecialCase
		displayStyle  TSpecialCase
	}

	// TRegion
	TRegion struct {
		classesOriginal string
		classesSorted   string
		index           int
		length          int
	}

	// TRegionList
	TRegionList []TRegion

	// TClassNameWeighing
	//
	// TClassNameWeighing.breakpointOrderWeight based on TConfigInput
	// classesOriginal.BreakpointGrouping
	//
	// "groupNameIndex": 100000
	// "groupOrderWeight": 100
	// "breakpointOrderWeight": 1 ("style") || 100000000 ("breakpoint")
	TClassNameWeighing struct {
		class                 string //nolint:unused // ...
		groupNameIndex        int
		groupOrderWeight      int
		breakpointOrderWeight int
	}

	// TClassNameWeighted
	TClassNameWeighted struct {
		original string //nolint:unused // ...
		sorted   string
		weight   int
	}

	// TClassNameWeightedList
	TClassNameWeightedList []TClassNameWeighted

	// TVariantSorting
	TVariantSorting struct {
		s string
		i int
	}

	// TClassNameVariantSorted
	TClassNameVariantSorted struct {
		original string
		sorted   string
		sl       []string
	}
)
