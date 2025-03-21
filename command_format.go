package main

import (
	"bytes"
	"cmp"
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

/*
"removeList" checks as plain string (strings.HasPrefix) if "checkFromTail" == false

"removeList" compiles and checks as regex if "checkFromTail" == true
*/
func cleanup(input string, removeList []string, checkFromTail bool) string {
	for _, s := range removeList {
		switch checkFromTail {
		case false:
			if strings.HasPrefix(input, s) {
				input = input[len(s):]
			}

		case true:
			r := re.MustCompile(s, re.None)
			m, _ := r.FindStringMatch(input)

			if m != nil {
				input = input[:m.Capture.Index]
			}
		}
	}

	return input
}

/*
eg: [@supports(display:grid)]:

eg: has-[:focus]:
*/
func mergeDynamicVariantParts(sl []string) []string {
	var (
		isBracketOpen bool     = false
		merged        []string = []string{}
		current       int
	)

	for _, v := range sl {
		switch isBracketOpen {
		case true:
			current = len(merged) - 1
			merged[current] = merged[current] + ":" + v

			if strings.Contains(v, "]") {
				isBracketOpen = false
			}

		case false:
			merged = append(merged, v)

			if (strings.Contains(v, "-[") || strings.Index(v, "[") == 0) && !strings.Contains(v, "]") {
				isBracketOpen = true
			}
		}
	}

	return merged
}

func sortVariants(sl []string, variantOrder []string) string {
	if len(sl) == 0 {
		return ""
	}

	var (
		output             string            = ""
		base               string            = sl[len(sl)-1]
		variantList        []string          = sl[0 : len(sl)-1]
		variantListSorting []TVariantSorting = make([]TVariantSorting, len(variantList))
	)

	if len(sl) == 1 {
		return sl[0]
	}

	for i, v := range variantList {
		variantIndex := slices.Index(variantOrder, v)
		s := ""

		switch {
		case variantIndex != -1:
			variantListSorting[i].s = v
			variantListSorting[i].i = variantIndex

		// [@supports(*)] | [@media(*)]
		case strings.Index(v, "[@") == 0:
			s = strings.Split(v, "(")[0] + "(*)]"
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, s)

		// [&_*]
		case strings.Index(v, "[&_") == 0:
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "[&_*]")

		// [&:*]
		case strings.Index(v, "[&:") == 0:
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "[&:*]")

		// @[*] | @[*]/*
		case strings.Index(v, "@[") == 0:
			s = "@[*]"

			if strings.Contains(v, "]/") {
				s += "/*"
			}

			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, s)

		// @min-[*]
		case strings.Index(v, "@min-[") == 0:
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "@min-[*]")

		// @min-3xs/* | @min-2xs/* | @min-xs/* | @min-sm/* | @min-md/* | @min-lg/* | @min-xl/* | @min-2xl/* | @min-3xl/* | @min-4xl/* | @min-5xl/* | @min-6xl/* | @min-7xl/*
		case strings.Index(v, "@min-") == 0 && strings.Contains(v, "/"):
			s = strings.Split(v, "/")[0] + "/*"
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, s)

		// @min-*
		case strings.Index(v, "@min-") == 0:
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "@min-*")

		// @max-[*]
		case strings.Index(v, "@max-[") == 0:
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "@max-[*]")

		// @max-3xs/* | @max-2xs/* | @max-xs/* | @max-sm/* | @max-md/* | @max-lg/* | @max-xl/* | @max-2xl/* | @max-3xl/* | @max-4xl/* | @max-5xl/* | @max-6xl/* | @max-7xl/*
		case strings.Index(v, "@max-") == 0 && strings.Contains(v, "/"):
			s = strings.Split(v, "/")[0] + "/*"
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, s)

		// @max-*
		case strings.Index(v, "@max-") == 0:
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "@max-*")

		// @3xs/* | @2xs/* | @xs/* | @sm/* | @md/* | @lg/* | @xl/* | @2xl/* | @3xl/* | @4xl/* | @5xl/* | @6xl/* | @7xl/*
		case strings.Index(v, "@") == 0 && strings.Contains(v, "/"):
			s = strings.Split(v, "/")[0] + "/*"
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, s)

		// supports-[*]
		case strings.Index(v, "supports-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "supports-[*]")

		// supports-*
		case strings.Index(v, "supports-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "supports-*")

		// group-aria-*
		case strings.Index(v, "group-aria-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "group-aria-*")

		// group-has-*
		case strings.Index(v, "group-has-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "group-has-*")

		// group-[*]
		case strings.Index(v, "group-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "group-[*]")

		// group-*
		case strings.Index(v, "group-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "group-*")

		// peer-aria-*
		case strings.Index(v, "peer-aria-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "peer-aria-*")

		// peer-has-*
		case strings.Index(v, "peer-has-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "peer-has-*")

		// peer-[*]
		case strings.Index(v, "peer-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "peer-[*]")

		// peer-*
		case strings.Index(v, "peer-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "peer-*")

		// aria-[*]
		case strings.Index(v, "aria-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "aria-[*]")

		// aria-*
		case strings.Index(v, "aria-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "aria-*")

		// data-[*]
		case strings.Index(v, "data-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "data-*")

		// data-*
		case strings.Index(v, "data-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "data-*")

		// has-[*]
		case strings.Index(v, "has-[") == 0:
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "has-[*]")

		// has-*
		case strings.Index(v, "has-") == 0:
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "has-*")

		// min-[*]
		case strings.Index(v, "min-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "min-[*]")

		// min-*
		case strings.Index(v, "min-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "min-*")

		// max-[*]
		case strings.Index(v, "max-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "max-[*]")

		// max-*
		case strings.Index(v, "max-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "max-*")

		// in-*
		case strings.Index(v, "in-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "in-*")

		// not-*
		case strings.Index(v, "not-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "not-*")

		// nth-last-of-type-[*]
		case strings.Index(v, "nth-last-of-type-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "nth-last-of-type-[*]")

		// nth-last-of-type-*
		case strings.Index(v, "nth-last-of-type-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "nth-last-of-type-*")

		// nth-of-type-[*]
		case strings.Index(v, "nth-of-type-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "nth-of-type-[*]")

		// nth-of-type-*
		case strings.Index(v, "nth-of-type-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "nth-of-type-*")

		// nth-last-[*]
		case strings.Index(v, "nth-last-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "nth-last-[*]")

		// nth-last-*
		case strings.Index(v, "nth-last-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "nth-last-*")

		// nth-[*]
		case strings.Index(v, "nth-[") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "nth-[*]")

		// nth-*
		case strings.Index(v, "nth-") == 0 && !slices.Contains(variantOrder, v):
			variantListSorting[i].s = v
			variantListSorting[i].i = slices.Index(variantOrder, "nth-*")

		default:
			variantListSorting[i].s = v
			variantListSorting[i].i = 99999
		}
	}

	slices.SortStableFunc(variantListSorting, func(a, b TVariantSorting) int {
		if n := cmp.Compare(a.i, b.i); n != 0 {
			return n
		}

		// If weight being equal
		return cmp.Compare(a.s, b.s)
	})

	for _, v := range variantListSorting {
		if output != "" {
			output += ":"
		}

		output += v.s
	}

	return output + ":" + base
}

func formatClassName(
	className string, config TConfig, regexps TRegexps, orderList TOrderList, groupNameList []string, specialCases TSpecialCases,
) (bool, bool, bool, TClassNameWeighted) {
	var (
		classNameConditionalReference   string
		classNameSorting                string = className
		groupNameSorting                string
		classNameWeighing               TClassNameWeighing = TClassNameWeighing{className, -1, -1, -1}
		conditionalClassnameSplitString string
		matchesConditionalClassName     *re.Match
		groupNameFoundIndexList         []int = []int{}
		classNameVariantSorted          []TClassNameVariantSorted
		classNameWeighted               TClassNameWeighted = TClassNameWeighted{className, "", -1}
		toBreakLoop                     bool               = false
		isConditionalClass              bool               = false
		isMatch                         bool
		sl                              []string
	)

	/* ---find css classes in conditional css - string doesn't start with [\dA-Za-z!@\-[] --- */
	if isMatch, _ = regexps.classStartCharacter.MatchString(classNameSorting); !isMatch && strings.Contains(classNameSorting, config.extensionRegex.ConditionalSplitCharacter) {
		isConditionalClass = true
	}

	if isConditionalClass {
		classNameSplitList := strings.Split(classNameSorting, config.extensionRegex.ConditionalSplitCharacter)

		switch config.extensionRegex.ConditionalClassLocation {
		case "before":
			conditionalClassnameSplitString = classNameSplitList[0]

		case "after":
			conditionalClassnameSplitString = classNameSplitList[1]
		}

		matchesConditionalClassName, _ = regexps.conditionalClassName.FindStringMatch(conditionalClassnameSplitString)

		for matchesConditionalClassName != nil {
			s := matchesConditionalClassName.String()
			s = s[1 : len(s)-1]

			if len(s) > 0 {
				classNameConditionalReference = s
				classNameSorting = s

				break
			}

			matchesConditionalClassName, _ = regexps.conditionalClassName.FindNextMatch(matchesConditionalClassName)
		}
	}

	/* ---remove className variants--- */
	if isMatch, _ = regexps.variant.MatchString(classNameSorting); isMatch {
		sl = strings.Split(classNameSorting, ":")
		classNameSorting = sl[len(sl)-1]
	}

	/* ---remove "!" from classNameSorting starting with "!"--- */
	classNameSorting = cleanup(classNameSorting, []string{"!"}, false)

	/* ---preparing for className for groupNameSorting--- */
	groupNameSorting = classNameSorting

	/* ---remove ["!", "-", "no-", "not-", "min-", "max-", "auto-"] for groupNameSorting--- */
	groupNameSorting = cleanup(classNameSorting, []string{"!", "-", "no-", "not-", "min-", "max-", "auto-"}, false)

	/* ---remove opacity modifier (eg: text-red-500/50)--- */
	groupNameSorting = cleanup(groupNameSorting, []string{"/\\d+$"}, true)

	/* ---remove group / peer differentiator (eg: group/{name}
	| peer/{name})--- */
	groupNameSorting = cleanup(groupNameSorting, []string{"/\\w+$"}, true)

	/* ---get groupName --- */
	sl = strings.Split(groupNameSorting, "-")
	groupNameSorting = sl[0]

	/* ---
	-> get groupNameIndex
	-> get groupOrderWeight
	--- */
	for i, v := range groupNameList {
		if v == groupNameSorting {
			groupNameFoundIndexList = append(groupNameFoundIndexList, i)
		}
	}

	lastIndex_groupNameFoundIndexList := len(groupNameFoundIndexList) - 1

	for groupNameFoundIndex, groupNameIndex := range groupNameFoundIndexList {
		lastIndex_orderListGroupNameIndex := len(orderList[groupNameIndex].Regex) - 1

		for classNameRegexIndex, classNameRegex := range orderList[groupNameIndex].Regex {
			r := re.MustCompile("^"+classNameRegex+"$", re.None)

			if isMatch, _ = r.MatchString(classNameSorting); isMatch {
				if classNameWeighing.groupOrderWeight < 0 && slices.Contains(specialCases.positionStyle.index, groupNameIndex) {
					classNameWeighing.groupNameIndex = specialCases.positionStyle.minimum * 100000
					classNameWeighing.groupOrderWeight = slices.Index(specialCases.positionStyle.classes, classNameSorting) * 100
				}

				if classNameWeighing.groupOrderWeight < 0 && slices.Contains(specialCases.displayStyle.index, groupNameIndex) {
					classNameWeighing.groupNameIndex = specialCases.displayStyle.minimum * 100000
					classNameWeighing.groupOrderWeight = slices.Index(specialCases.displayStyle.classes, classNameSorting) * 100
				}

				if classNameWeighing.groupOrderWeight < 0 {
					classNameWeighing.groupNameIndex = groupNameIndex * 100000
					classNameWeighing.groupOrderWeight = classNameRegexIndex * 100
				}

				break
			}

			/* ---Catch arbitrary classes (eg "bg-[#123456]")--- */
			if groupNameFoundIndex == lastIndex_groupNameFoundIndexList &&
				classNameRegexIndex == lastIndex_orderListGroupNameIndex &&
				strings.Contains(className, "[") &&
				strings.Contains(className, "]") {
				switch {
				case slices.Contains(specialCases.positionStyle.index, groupNameIndex):
					classNameWeighing.groupNameIndex = specialCases.positionStyle.minimum * 100000
					classNameWeighing.groupOrderWeight = slices.Index(specialCases.positionStyle.classes, classNameSorting) * 100

				case slices.Contains(specialCases.displayStyle.index, groupNameIndex):
					classNameWeighing.groupNameIndex = specialCases.displayStyle.minimum * 100000
					classNameWeighing.groupOrderWeight = slices.Index(specialCases.displayStyle.classes, classNameSorting) * 100

				default:
					classNameWeighing.groupNameIndex = groupNameIndex * 100000
					classNameWeighing.groupOrderWeight = len(orderList[groupNameIndex].Regex) * 100
				}

				break
			}
		}

		if classNameWeighing.groupNameIndex > -1 {
			break
		}
	}

	/* ---sort variants--- */
	switch isConditionalClass {
	case true:
		matchesConditionalClassName, _ = regexps.conditionalClassName.FindStringMatch(conditionalClassnameSplitString)

		if matchesConditionalClassName != nil {
			s := matchesConditionalClassName.String()
			s = s[1 : len(s)-1]
			classNameVariantSorted = append(classNameVariantSorted, TClassNameVariantSorted{original: s, sorted: "", sl: []string{}})

			switch strings.Contains(s, ":") {
			case true:
				classNameVariantSorted[0].sl = strings.Split(s, ":")
			case false:
				classNameVariantSorted[0].sl = []string{s}
			}
		}

		if config.extensionRegex.ConditionalClassLocation == "after" {
			for matchesConditionalClassName != nil {
				matchesConditionalClassName, _ = regexps.conditionalClassName.FindNextMatch(matchesConditionalClassName)

				if matchesConditionalClassName != nil {
					s := matchesConditionalClassName.String()
					s = s[1 : len(s)-1]
					classNameVariantSorted = append(classNameVariantSorted, TClassNameVariantSorted{original: s, sorted: "", sl: []string{}})
					i := len(classNameVariantSorted) - 1

					switch strings.Contains(s, ":") {
					case true:
						sl = strings.Split(s, ":")
						classNameVariantSorted[i].sl = strings.Split(s, ":")
					case false:
						classNameVariantSorted[i].sl = []string{s}
					}
				}
			}
		}

	case false:
		classNameVariantSorted = append(classNameVariantSorted, TClassNameVariantSorted{original: className, sorted: "", sl: []string{}})

		switch strings.Contains(className, ":") {
		case true:
			sl = strings.Split(className, ":")
			classNameVariantSorted[0].sl = strings.Split(className, ":")
		case false:
			classNameVariantSorted[0].sl = []string{className}
		}
	}

	/* ---
	-> merge parts of dynamic variants that contains ":"
	-> reorder variants
	-> replace classNameVariantUnsorted with classNameVariantSorted
	--- */
	for i, v := range classNameVariantSorted {
		sl = mergeDynamicVariantParts(v.sl)
		classNameVariantSorted[i].sl = sl
		s := sortVariants(sl, config.variantOrdering)
		classNameVariantSorted[i].sorted = s
		className = strings.Replace(className, classNameVariantSorted[i].original, classNameVariantSorted[i].sorted, 1)

		if classNameVariantSorted[i].original == classNameConditionalReference {
			classNameConditionalReference = classNameVariantSorted[i].sorted
		}
	}

	/* ---get breakpointOrderWeight--- */
	switch {
	case isConditionalClass && !strings.Contains(classNameConditionalReference, ":"):
		classNameWeighing.breakpointOrderWeight = 0

	case !isConditionalClass && !strings.Contains(className, ":"):
		classNameWeighing.breakpointOrderWeight = 0

	default:
		for _, v := range classNameVariantSorted {
			if v.sorted != "" {
				sl = v.sl[0 : len(v.sl)-1]

				for index, breakpoint := range config.breakpointOrder {
					if toBreakLoop {
						toBreakLoop = false

						break
					}

					weight := index + 1

					switch {
					case slices.Contains(sl, breakpoint):
						classNameWeighing.breakpointOrderWeight = weight * config.breakpointOrderWeightMultiplier
						toBreakLoop = true

					// @[*] | @[*]/*
					case strings.Index(breakpoint, "@[") == 0:
						s := ""

						for _, v1 := range sl {
							if strings.Index(v1, "@[") == 0 {
								s = "@[*]"

								if strings.Contains(v1, "/") {
									s += "/*"
								}
							}

							if len(s) > 0 {
								break
							}
						}

						if len(s) > 0 && s == breakpoint {
							classNameWeighing.breakpointOrderWeight = weight * config.breakpointOrderWeightMultiplier
							toBreakLoop = true
						}

					// @(xs | sm | md | lg | xl | 2xl | 3xl | 4xl | 5xl | 6xl | 7xl)/*
					case strings.Index(breakpoint, "@") == 0:
						s := ""

						for _, v1 := range sl {
							if strings.Index(v1, "@") == 0 && strings.Contains(v1, "/") {
								s = strings.Split(v1, "/")[0] + "/*"
							}

							if len(s) > 0 {
								break
							}
						}

						if len(s) > 0 && s == breakpoint {
							classNameWeighing.breakpointOrderWeight = weight * config.breakpointOrderWeightMultiplier
							toBreakLoop = true
						}

					case breakpoint == "min-*" || breakpoint == "max-*":
						s := breakpoint[0 : len(breakpoint)-1]

						if slices.ContainsFunc(sl, func(element string) bool {
							return strings.Contains(element, s)
						}) {
							classNameWeighing.breakpointOrderWeight = weight * config.breakpointOrderWeightMultiplier
							toBreakLoop = true
						}
					}

					/* ---no breakpoint found--- */
					if !toBreakLoop && index == len(config.breakpointOrder)-1 {
						classNameWeighing.breakpointOrderWeight = 0
					}
				}

				break
			}
		}
	}

	/* ---add className to weighted list or non-tailwindcss list--- */
	switch classNameWeighing.groupNameIndex {
	case -1:
		return true, false, false, TClassNameWeighted{"", "", -1}

	default:
		classNameWeighted.weight = classNameWeighing.groupNameIndex + classNameWeighing.groupOrderWeight + classNameWeighing.breakpointOrderWeight
		classNameWeighted.sorted = className

		if isMatch, _ = regexps.before.MatchString(className); isMatch {
			return false, true, false, classNameWeighted
		}

		if isMatch, _ = regexps.after.MatchString(className); isMatch {
			return false, false, true, classNameWeighted
		}

		return false, false, false, classNameWeighted
	}
}

func formatRegion(
	region TRegion, config TConfig, regexps TRegexps, orderList TOrderList, groupNameList []string, specialCases TSpecialCases,
) string {
	var (
		classList                []string               = []string{}
		beforePseudoWeightedList TClassNameWeightedList = []TClassNameWeighted{}
		afterPseudoWeightedList  TClassNameWeightedList = []TClassNameWeighted{}
		classNameWeightedList    TClassNameWeightedList = []TClassNameWeighted{}
		nonTailwindCss           string                 = ""
		beforePseudoSorted       string                 = ""
		afterPseudoSorted        string                 = ""
		classSorted              string                 = ""
		output                   string                 = ""
	)

	/* ---find css classes in region --- */
	matches, _ := regexps.class.FindStringMatch(region.classesOriginal)

	for matches != nil {
		classList = append(classList, matches.String())
		matches, _ = regexps.class.FindNextMatch(matches)
	}

	/* ---
	-> get css class order weight
	-> add in groupedWeightedClassList
	--- */
	for _, className := range classList {
		className = strings.TrimSpace(className)
		isNonTailwindCss, isBeforePseudoElement, isAfterPseudoElement, classNameWeighted := formatClassName(className, config, regexps, orderList, groupNameList, specialCases)

		/* ---add className to non-tailwindcss list or weighted list--- */
		switch {
		case isNonTailwindCss:
			switch len(nonTailwindCss) {
			case 0:
				nonTailwindCss = className

			default:
				nonTailwindCss = nonTailwindCss + config.extensionRegex.Separator + className
			}

		case isBeforePseudoElement:
			beforePseudoWeightedList = append(beforePseudoWeightedList, classNameWeighted)

		case isAfterPseudoElement:
			afterPseudoWeightedList = append(afterPseudoWeightedList, classNameWeighted)

		default:
			classNameWeightedList = append(classNameWeightedList, classNameWeighted)
		}
	}

	if len(beforePseudoWeightedList) > 0 {
		if len(beforePseudoWeightedList) > 1 {
			slices.SortStableFunc(beforePseudoWeightedList, func(a, b TClassNameWeighted) int {
				return cmp.Compare(a.weight, b.weight)
			})
		}

		lastIndex := len(beforePseudoWeightedList) - 1

		for i, v := range beforePseudoWeightedList {
			beforePseudoSorted += v.sorted

			if i < lastIndex {
				beforePseudoSorted += config.extensionRegex.Separator
			}
		}
	}

	if len(afterPseudoWeightedList) > 0 {
		if len(afterPseudoWeightedList) > 1 {
			slices.SortStableFunc(afterPseudoWeightedList, func(a, b TClassNameWeighted) int {
				return cmp.Compare(a.weight, b.weight)
			})
		}

		lastIndex := len(afterPseudoWeightedList) - 1

		for i, v := range afterPseudoWeightedList {
			afterPseudoSorted += v.sorted

			if i < lastIndex {
				afterPseudoSorted += config.extensionRegex.Separator
			}
		}
	}

	if len(classNameWeightedList) > 0 {
		if len(classNameWeightedList) > 1 {
			slices.SortStableFunc(classNameWeightedList, func(a, b TClassNameWeighted) int {
				return cmp.Compare(a.weight, b.weight)
			})
		}

		lastIndex := len(classNameWeightedList) - 1

		for i, v := range classNameWeightedList {
			classSorted += v.sorted

			if i < lastIndex {
				classSorted += config.extensionRegex.Separator
			}
		}
	}

	if config.extensionRegex.Separator != " " {
		output = config.extensionRegex.Separator
	}

	switch config.nonTailwindcssPlacement {
	case "front":
		output += nonTailwindCss

		if len(output) > 0 && len(beforePseudoSorted) > 0 {
			output += config.extensionRegex.Separator
		}

		output += beforePseudoSorted

		if len(output) > 0 && len(afterPseudoSorted) > 0 {
			output += config.extensionRegex.Separator
		}

		output += afterPseudoSorted

		if len(output) > 0 && len(classSorted) > 0 {
			output += config.extensionRegex.Separator
		}

		output += classSorted

	case "back":
		output += classSorted

		if len(output) > 0 && len(beforePseudoSorted) > 0 {
			output += config.extensionRegex.Separator
		}

		output += beforePseudoSorted

		if len(output) > 0 && len(afterPseudoSorted) > 0 {
			output += config.extensionRegex.Separator
		}

		output += afterPseudoSorted

		if len(output) > 0 && len(nonTailwindCss) > 0 {
			output += config.extensionRegex.Separator
		}

		output += nonTailwindCss

	}

	return output
}

func format(
	filepath, extension, code string, isCodeInput, isRegionInput bool, config TConfig, regexps TRegexps, specialCases TSpecialCases, orderList TOrderList, groupNameList []string, wg *sync.WaitGroup, isAsync bool,
) {
	var (
		err        error
		regionList TRegionList
		start      string
		end        string
		encoder    *json.Encoder
		buffer     bytes.Buffer
		sl         []string
	)

	if isAsync {
		defer wg.Done()
	}

	re.DefaultMatchTimeout = time.Second * 5

	/* ---define default regex(es)--- */
	regexps.region = re.MustCompile(config.extensionRegex.Region, re.None)
	regexps.class = re.MustCompile(config.extensionRegex.Class, re.None)

	/* ---
	-> find regions
	-> get region lengths
	--- */
	switch isRegionInput {
	case true:
		json.Unmarshal([]byte(code), &sl)

		switch len(sl) {
		case 0:
			err = makeError("\"--region-input\" flag is set and \"--code\" is not base64-encoded json/jsonc array of regions (strings)")
			handleError(err, "input error", false)

		default:
			for _, v := range sl {
				regionList = append(regionList, TRegion{v, "", -1, -1})
			}
		}

	case false:
		matches, _ := regexps.region.FindStringMatch(code)

		for matches != nil {
			regionList = append(regionList, TRegion{matches.String(), "", matches.Capture.Index, matches.Capture.Length})
			matches, _ = regexps.region.FindNextMatch(matches)
		}
	}

	/* ---format in reverse order of found matches--- */
	regionIndex := len(regionList) - 1
	sl = []string{}

	for regionIndex >= 0 {
		regionList[regionIndex].classesSorted = formatRegion(regionList[regionIndex], config, regexps, orderList, groupNameList, specialCases)

		switch isRegionInput {
		case true:
			sl = append([]string{regionList[regionIndex].classesSorted}, sl...)

		case false:
			start = code[:regionList[regionIndex].index]
			end = code[regionList[regionIndex].index+regionList[regionIndex].length:]
			code = start + regionList[regionIndex].classesSorted + end
		}

		regionIndex -= 1
	}

	/* ---print to stdout | write to file--- */
	switch {
	case isCodeInput && isRegionInput:
		encoder = json.NewEncoder(&buffer)
		encoder.SetEscapeHTML(false)
		encoder.Encode(sl)
		fmt.Println(encodeBase64(buffer.Bytes(), true, true))

	case isCodeInput && !isRegionInput:
		fmt.Println(encodeBase64([]byte(code), true, true))

	case !isCodeInput:
		writeFile([]byte(code), filepath, true, false, false)
	}
}

func formatCommand(isBase64Config, isEmbeddedConfig, isRegionInput bool, code, codeExt string, filepaths []string, configRaw string) {
	var (
		configByte      []byte
		configInput     TConfigInput
		orderList       TOrderList
		groupNameList   []string = []string{}
		defaultOrderMap map[string]TOrderList
		codeByte        []byte
		config          TConfig
		regexps         TRegexps
		specialCases    TSpecialCases
		extensionRegex  TExtensionRegex
		err             error
		ok              bool
		wg              sync.WaitGroup
	)

	// get config/order
	json.Unmarshal(jsonc.ToJSON(orderListDefault), &defaultOrderMap)
	configByte = getUserConfig(configRaw, isBase64Config)
	configInput = normaliseConfig(configByte, isEmbeddedConfig, false)

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

	config = TConfig{
		nonTailwindcssPlacement: configInput.NonTailwindcssPlacement,
		orderType:               configInput.OrderType,
		breakpointGrouping:      configInput.BreakpointGrouping,
		variantOrdering:         configInput.VariantOrdering,
		breakpointOrder:         configInput.BreakpointOrder,
	}

	/* ---define breakpointOrderWeightMultiplier--- */
	switch config.breakpointGrouping {
	case "style":
		config.breakpointOrderWeightMultiplier = 1

	case "breakpoint":
		config.breakpointOrderWeightMultiplier = 100000000
	}

	/* ---define default regexps--- */
	regexps.classStartCharacter = re.MustCompile("^[\\dA-Za-z*!@\\-[\\\\]", re.None)
	regexps.conditionalClassName = re.MustCompile("(\"[^\"]*?\")|('[^']*?')|(`[^`]*?`)", re.None)
	regexps.variant = re.MustCompile(":[\\dA-Za-z!@\\-\\\\]", re.None)
	regexps.before = re.MustCompile("(^before:)|(:before:)", re.None)
	regexps.after = re.MustCompile("(^after:)|(:after:)", re.None)

	/* ---define special cases--- */
	specialCases = TSpecialCases{
		positionStyle: TSpecialCase{
			classes: []string{"static", "absolute", "relative", "fixed", "sticky"},
			index:   []int{},
			minimum: -1,
		},
		displayStyle: TSpecialCase{
			classes: []string{"hidden", "inline", "block", "flex", "grid", "table", "contents", "flow", "list"},
			index:   []int{},
			minimum: -1,
		},
	}

	for _, v := range specialCases.positionStyle.classes {
		i := slices.Index(groupNameList, v)
		specialCases.positionStyle.index = append(specialCases.positionStyle.index, i)
	}

	specialCases.positionStyle.minimum = slices.Min(specialCases.positionStyle.index)

	for _, v := range specialCases.displayStyle.classes {
		i := slices.Index(groupNameList, v)
		specialCases.displayStyle.index = append(specialCases.displayStyle.index, i)
	}

	specialCases.displayStyle.minimum = slices.Min(specialCases.displayStyle.index)

	switch {
	// handle code
	case len(code) > 0 && len(codeExt) > 0:
		if extensionRegex, ok = configInput.ExtensionsRegex[codeExt]; !ok {
			err = makeError("cannot find \"--code-ext\" in \"extensions_regex\" config option")
			handleError(err, "flags error", true)
		}

		codeByte, _ = decodeBase64(code, true, false)
		config.extensionRegex = extensionRegex
		format("", codeExt, string(codeByte), true, isRegionInput, config, regexps, specialCases, orderList, groupNameList, &wg, false)

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

			config.extensionRegex = extensionRegex

			switch filepathsLength {
			case 1:
				format(v, extension, string(codeByte), false, false, config, regexps, specialCases, orderList, groupNameList, &wg, false)

			default:
				wg.Add(1)
				go format(v, extension, string(codeByte), false, false, config, regexps, specialCases, orderList, groupNameList, &wg, true)
			}
		}

		wg.Wait()
	}
}
