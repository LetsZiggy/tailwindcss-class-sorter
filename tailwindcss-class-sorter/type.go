package main

type TExtensionRegex struct {
	Region                    string `json:"region"`
	Class                     string `json:"class"`
	ConditionalSplitCharacter string `json:"conditional_split_character,omitempty" default:"?"`
	ConditionalClassLocation  string `json:"conditional_class_location,omitempty" options:"before|after" default:"after"`
	Separator                 string `json:"separator,omitempty" default:" "`
}

type TOverwrite struct {
	GroupIndex int      `json:"group_index"`
	RegexList  []string `json:"regex_list"`
}

type TAmend struct {
	GroupIndex int      `json:"group_index"`
	Position   string   `json:"position" options:"start|end" default:"end"`
	RegexList  []string `json:"regex_list"`
}

type TAppend struct {
	GroupIndex  int      `json:"group_index"`
	GroupName   string   `json:"group_name"`
	Position    string   `json:"position" options:"before|after" default:"after"`
	AppendOrder int      `json:"append_order"`
	RegexList   []string `json:"regex_list"`
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

type TConfigInput struct {
	NonTailwindcssPlacement string                     `json:"non_tailwindcss_placement" options:"front|back" default:"front"`
	ExtensionsRegex         map[string]TExtensionRegex `json:"extensions_regex"`
	OrderType               string                     `json:"order_type" options:"recess|concentric|smacss" default:"recess"`
	EditOrder               TEditOrder                 `json:"edit_order"`
	BreakpointGrouping      string                     `json:"breakpoint_grouping" options:"style|breakpoint" default:"style"`
	VariantOrdering         []string                   `json:"variant_ordering"`
	BreakpointOrder         []string                   `json:"breakpoint_order"`
	CustomOrder             TOrderList                 `json:"custom_order"`
}

type TConfig struct {
	NonTailwindcssPlacement string
	ExtensionRegex          TExtensionRegex
	OrderType               string
	BreakpointGrouping      string
	VariantOrdering         []string
	BreakpointOrder         []string
}

type TSpecialCase struct {
	Classes []string
	Index   []int
	Minimum int
}

type TSpecialCases struct {
	PositionStyle TSpecialCase
	DisplayStyle  TSpecialCase
}

type TRegion struct {
	Classes string
	Index   int
	Length  int
}

type TRegionList []TRegion

type TWeightedClass struct {
	class  string
	weight float32
}

type TWeightedClassList []TWeightedClass

type TGroupedWeightedClass struct {
	GroupName         string
	WeightedClassList TWeightedClassList
}
