package main

type TExtensionRegex struct {
	Region                    string `json:"region" type:"string"`
	Class                     string `json:"class" type:"string"`
	ConditionalSplitCharacter string `json:"conditional_split_character,omitempty" type:"string" default:"?"`
	ConditionalClassLocation  string `json:"conditional_class_location,omitempty" type:"string" options:"before|after" default:"after"`
	Separator                 string `json:"separator,omitempty" type:"string" default:" "`
}

type TOverwrite struct {
	GroupIndex int      `json:"group_index" type:"int"`
	RegexList  []string `json:"regex_list" type:"array,string"`
}

type TAmend struct {
	GroupIndex int      `json:"group_index" type:"int"`
	Position   string   `json:"position" type:"string" options:"start|end" default:"end"`
	RegexList  []string `json:"regex_list" type:"array,string"`
}

type TAppend struct {
	GroupIndex  int      `json:"group_index" type:"int"`
	GroupName   string   `json:"group_name" type:"string"`
	Position    string   `json:"position" type:"string" options:"before|after" default:"after"`
	AppendOrder int      `json:"append_order" type:"int"`
	RegexList   []string `json:"regex_list" type:"array,string"`
}

type TEditOrder struct {
	Overwrite []TOverwrite `json:"overwrite" type:"array,struct.Overwrite"`
	Amend     []TAmend     `json:"amend" type:"array,struct.Amend"`
	Append    []TAppend    `json:"append" type:"array,struct.Append"`
}

type TOrderGroup struct {
	GroupName string   `json:"group_name" type:"string"`
	Regex     []string `json:"regex" type:"array,string"`
}

type TOrder []TOrderGroup

type TOrderGroupIndex struct {
	Index     int      `json:"index" type:"int"`
	GroupName string   `json:"group_name" type:"string"`
	Regex     []string `json:"regex" type:"array,string"`
}

type TOrderIndex []TOrderGroupIndex

type TConfig struct {
	NonTailwindcssPlacement string                     `json:"non_tailwindcss_placement" type:"string" options:"front|back" default:"front"`
	ExtensionsRegex         map[string]TExtensionRegex `json:"extensions_regex" type:"map,string,struct.ExtensionRegex"`
	OrderType               string                     `json:"order_type" type:"string" options:"recess|concentric|smacss" default:"recess"`
	EditOrder               TEditOrder                 `json:"edit_order" type:"struct.EditOrder"`
	BreakpointGrouping      string                     `json:"breakpoint_grouping" type:"string" options:"style|breakpoint" default:"style"`
	VariantOrdering         []string                   `json:"variant_ordering" type:"array,string"`
	BreakpointOrder         []string                   `json:"breakpoint_order" type:"array,string"`
	CustomOrder             TOrder                     `json:"custom_order" type:"array,struct.TOrderGroup"`
}

type TFormatHelpStrings struct {
	code    []string
	codeExt []string
	config  []string
}

type TListHelpStrings struct {
	base64          []string
	config          []string
	showEditedOrder []string
}

type THelpStrings struct {
	format TFormatHelpStrings
	list   TListHelpStrings
}
