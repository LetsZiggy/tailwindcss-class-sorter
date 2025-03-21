package main

import (
	re "github.com/dlclark/regexp2"
)

type TExtensionRegex struct {
	Region                    string `json:"region"`
	Class                     string `json:"class"`
	ConditionalSplitCharacter string `json:"conditional_split_character,omitempty" default:"?"`
	ConditionalClassLocation  string `json:"conditional_class_location,omitempty" options:"before|after" default:"after"`
	Separator                 string `json:"separator,omitempty" default:" "`
}

type TOverwrite struct {
	GroupIndex int      `json:"group_index"`
	Regex      []string `json:"regex"`
}

type TAmend struct {
	GroupIndex int      `json:"group_index"`
	Position   string   `json:"position" options:"start|end" default:"end"`
	Regex      []string `json:"regex"`
}

type TAppend struct {
	GroupIndex  int      `json:"group_index"`
	GroupName   string   `json:"group_name"`
	Position    string   `json:"position" options:"before|after" default:"after"`
	AppendOrder int      `json:"append_order"`
	Regex       []string `json:"regex"`
}

type TEditOrder struct {
	Overwrite []TOverwrite `json:"overwrite"`
	Amend     []TAmend     `json:"amend"`
	Append    []TAppend    `json:"append"`
}

type TOrderGroup struct {
	GroupName string   `json:"group_name"`
	Regex     []string `json:"regex"`
}

type TOrderList []TOrderGroup

type TOrderGroupIndex struct {
	Index     int      `json:"index"`
	GroupName string   `json:"group_name"`
	Regex     []string `json:"regex"`
}

type TOrderIndex []TOrderGroupIndex

type TEmbeddedConfigInput struct {
	TailwindcssClassSorter TConfigInput `json:"tailwindcss_class_sorter,omitempty"`
}

type TConfigInput struct {
	NonTailwindcssPlacement string                     `json:"non_tailwindcss_placement,omitempty" options:"front|back" default:"front"`
	ExtensionsRegex         map[string]TExtensionRegex `json:"extensions_regex,omitempty"`
	OrderType               string                     `json:"order_type,omitempty" options:"recess|concentric" default:"recess"`
	EditOrder               TEditOrder                 `json:"edit_order,omitempty"`
	BreakpointGrouping      string                     `json:"breakpoint_grouping,omitempty" options:"style|breakpoint" default:"style"`
	VariantOrdering         []string                   `json:"variant_ordering,omitempty"`
	BreakpointOrder         []string                   `json:"breakpoint_order,omitempty"`
	CustomOrder             TOrderList                 `json:"custom_order,omitempty"`
}

type TConfig struct {
	nonTailwindcssPlacement         string
	extensionRegex                  TExtensionRegex
	orderType                       string
	breakpointGrouping              string
	variantOrdering                 []string
	breakpointOrder                 []string
	breakpointOrderWeightMultiplier int
}

type TRegexps struct {
	classStartCharacter  *re.Regexp
	conditionalClassName *re.Regexp
	variant              *re.Regexp
	region               *re.Regexp
	class                *re.Regexp
	before               *re.Regexp
	after                *re.Regexp
}

type TSpecialCase struct {
	classes []string
	index   []int
	minimum int
}

type TSpecialCases struct {
	positionStyle TSpecialCase
	displayStyle  TSpecialCase
}

type TRegion struct {
	classesOriginal string
	classesSorted   string
	index           int
	length          int
}

type TRegionList []TRegion

/*
"groupNameIndex": 100000
"groupOrderWeight": 100
"breakpointOrderWeight": 1 ("style") || 100000000 ("breakpoint")
*/
type TClassNameWeighing struct {
	class                 string
	groupNameIndex        int
	groupOrderWeight      int
	breakpointOrderWeight int
}

type TClassNameWeighted struct {
	original string
	sorted   string
	weight   int
}

type TClassNameWeightedList []TClassNameWeighted

type TVariantSorting struct {
	s string
	i int
}

type TClassNameVariantSorted struct {
	original string
	sorted   string
	sl       []string
}
