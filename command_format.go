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

	re "github.com/dlclark/regexp2/v2"
	"github.com/tidwall/jsonc"
)

/*
"removeList" checks as plain string (strings.HasPrefix) if "checkFromTail" == false

"removeList" compiles and checks as regex if "checkFromTail" == true
*/
func cleanup(input string, removeList []string, checkFromTail bool) string {
	var (
		m   *re.Match
		err error
	)

	for _, s := range removeList {
		switch checkFromTail {
		case true:
			r := re.MustCompile(s, re.None)

			m, err = r.FindStringMatch(input)
			handleError(err, "cleanup r.FindStringMatch", true)

			if m != nil {
				input = input[:m.RuneIndex]
			}

		case false:
			input = strings.TrimPrefix(input, s)

		default:
			handleError(makeError("never"), "not expected values `true` | `false`", true)
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
		isBracketOpen = false
		merged        = []string{}
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

		default:
			handleError(makeError("never"), "not expected values `true` | `false`", true)
		}
	}

	return merged
}

func sortVariants(sl, variantOrder []string) string {
	if len(sl) == 0 {
		return ""
	}

	var (
		output             = ""
		base               = sl[len(sl)-1]
		variantList        = sl[0 : len(sl)-1]
		variantListSorting = make([]TVariantSorting, len(variantList))
	)

	if len(sl) == 1 {
		return sl[0]
	}

	for i, v := range variantList {
		var (
			s            string
			variantIndex = slices.Index(variantOrder, v)
		)

	SWITCH_LABEL: //nolint:gocritic // ...
		switch {
		case variantIndex != -1:
			break SWITCH_LABEL

		// [@supports(*)] | [@media(*)]
		case strings.Index(v, "[@") == 0:
			s = strings.Split(v, "(")[0] + "(*)]"
			variantIndex = slices.Index(variantOrder, s)

		// [&.*]
		case strings.Index(v, "[&.") == 0:
			s = "[&.*]"
			variantIndex = slices.Index(variantOrder, s)

		// [&_*]
		case strings.Index(v, "[&_") == 0:
			s = "[&_*]"
			variantIndex = slices.Index(variantOrder, s)

		// [&:*]
		case strings.Index(v, "[&:") == 0:
			s = "[&:*]"
			variantIndex = slices.Index(variantOrder, s)

		// @[*]/* | @[*]
		case strings.Index(v, "@[") == 0:
			s = "@[*]"

			if strings.Contains(v, "]/") {
				s += "/*"
			}

			variantIndex = slices.Index(variantOrder, s)

		// @min-[*]/* | @min-[*]
		case strings.Index(v, "@min-[") == 0:
			s = "@min-[*]"

			if strings.Contains(v, "]/") {
				s += "/*"
			}

			variantIndex = slices.Index(variantOrder, s)

		// @min-3xs/* | ... | @min-7xl/* | @min-*/* | @min-*
		case strings.Index(v, "@min-") == 0:
			if strings.Contains(v, "/") {
				s = strings.Split(v, "/")[0]

				if slices.Index(variantOrder, s) != -1 { // @min-3xs/* | ... | @min-7xl/*
					s += "/*"
				} else {
					s = "@min-*/*"
				}
			} else {
				s = "@min-*"
			}

			variantIndex = slices.Index(variantOrder, s)

		// @max-[*]/* | @max-[*]
		case strings.Index(v, "@max-[") == 0:
			s = "@max-[*]"

			if strings.Contains(v, "]/") {
				s += "/*"
			}

			variantIndex = slices.Index(variantOrder, s)

		// @max-3xs/* | ... | @max-7xl/* | @max-*/* | @max-*
		case strings.Index(v, "@max-") == 0:
			if strings.Contains(v, "/") {
				s = strings.Split(v, "/")[0]

				if slices.Index(variantOrder, s) != -1 { // @max-3xs/* | ... | @max-7xl/*
					s += "/*"
				} else {
					s = "@max-*/*"
				}
			} else {
				s = "@max-*"
			}

			variantIndex = slices.Index(variantOrder, s)

		// @3xs/* | ... | @7xl/*
		case strings.Index(v, "@") == 0 && strings.Contains(v, "/"):
			s = strings.Split(v, "/")[0] + "/*"
			variantIndex = slices.Index(variantOrder, s)

		// supports-[*]
		case strings.Index(v, "supports-[") == 0 && !slices.Contains(variantOrder, v):
			s = "supports-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// supports-*
		case strings.Index(v, "supports-") == 0 && !slices.Contains(variantOrder, v):
			s = "supports-*"
			variantIndex = slices.Index(variantOrder, s)

		// group-aria-*
		case strings.Index(v, "group-aria-") == 0 && !slices.Contains(variantOrder, v):
			s = "group-aria-*"
			variantIndex = slices.Index(variantOrder, s)

		// group-has-*
		case strings.Index(v, "group-has-") == 0 && !slices.Contains(variantOrder, v):
			s = "group-has-*"
			variantIndex = slices.Index(variantOrder, s)

		// group-[*]
		case strings.Index(v, "group-[") == 0 && !slices.Contains(variantOrder, v):
			s = "group-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// group-*
		case strings.Index(v, "group-") == 0 && !slices.Contains(variantOrder, v):
			s = "group-*"
			variantIndex = slices.Index(variantOrder, s)

		// peer-aria-*
		case strings.Index(v, "peer-aria-") == 0 && !slices.Contains(variantOrder, v):
			s = "peer-aria-*"
			variantIndex = slices.Index(variantOrder, s)

		// peer-has-*
		case strings.Index(v, "peer-has-") == 0 && !slices.Contains(variantOrder, v):
			s = "peer-has-*"
			variantIndex = slices.Index(variantOrder, s)

		// peer-[*]
		case strings.Index(v, "peer-[") == 0 && !slices.Contains(variantOrder, v):
			s = "peer-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// peer-*
		case strings.Index(v, "peer-") == 0 && !slices.Contains(variantOrder, v):
			s = "peer-*"
			variantIndex = slices.Index(variantOrder, s)

		// aria-[*]
		case strings.Index(v, "aria-[") == 0 && !slices.Contains(variantOrder, v):
			s = "aria-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// aria-*
		case strings.Index(v, "aria-") == 0 && !slices.Contains(variantOrder, v):
			s = "aria-*"
			variantIndex = slices.Index(variantOrder, s)

		// data-[*]
		case strings.Index(v, "data-[") == 0 && !slices.Contains(variantOrder, v):
			s = "data-*"
			variantIndex = slices.Index(variantOrder, s)

		// data-*
		case strings.Index(v, "data-") == 0 && !slices.Contains(variantOrder, v):
			s = "data-*"
			variantIndex = slices.Index(variantOrder, s)

		// has-[*]
		case strings.Index(v, "has-[") == 0:
			s = "has-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// has-*
		case strings.Index(v, "has-") == 0:
			s = "has-*"
			variantIndex = slices.Index(variantOrder, s)

		// min-[*]
		case strings.Index(v, "min-[") == 0 && !slices.Contains(variantOrder, v):
			s = "min-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// min-*
		case strings.Index(v, "min-") == 0 && !slices.Contains(variantOrder, v):
			s = "min-*"
			variantIndex = slices.Index(variantOrder, s)

		// max-[*]
		case strings.Index(v, "max-[") == 0 && !slices.Contains(variantOrder, v):
			s = "max-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// max-*
		case strings.Index(v, "max-") == 0 && !slices.Contains(variantOrder, v):
			s = "max-*"
			variantIndex = slices.Index(variantOrder, s)

		// in-*
		case strings.Index(v, "in-") == 0 && !slices.Contains(variantOrder, v):
			s = "in-*"
			variantIndex = slices.Index(variantOrder, s)

		// not-*
		case strings.Index(v, "not-") == 0 && !slices.Contains(variantOrder, v):
			s = "not-*"
			variantIndex = slices.Index(variantOrder, s)

		// nth-last-of-type-[*]
		case strings.Index(v, "nth-last-of-type-[") == 0 && !slices.Contains(variantOrder, v):
			s = "nth-last-of-type-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// nth-last-of-type-*
		case strings.Index(v, "nth-last-of-type-") == 0 && !slices.Contains(variantOrder, v):
			s = "nth-last-of-type-*"
			variantIndex = slices.Index(variantOrder, s)

		// nth-of-type-[*]
		case strings.Index(v, "nth-of-type-[") == 0 && !slices.Contains(variantOrder, v):
			s = "nth-of-type-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// nth-of-type-*
		case strings.Index(v, "nth-of-type-") == 0 && !slices.Contains(variantOrder, v):
			s = "nth-of-type-*"
			variantIndex = slices.Index(variantOrder, s)

		// nth-last-[*]
		case strings.Index(v, "nth-last-[") == 0 && !slices.Contains(variantOrder, v):
			s = "nth-last-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// nth-last-*
		case strings.Index(v, "nth-last-") == 0 && !slices.Contains(variantOrder, v):
			s = "nth-last-*"
			variantIndex = slices.Index(variantOrder, s)

		// nth-[*]
		case strings.Index(v, "nth-[") == 0 && !slices.Contains(variantOrder, v):
			s = "nth-[*]"
			variantIndex = slices.Index(variantOrder, s)

		// nth-*
		case strings.Index(v, "nth-") == 0 && !slices.Contains(variantOrder, v):
			s = "nth-*"
			variantIndex = slices.Index(variantOrder, s)

		default:
			variantIndex = 99999
		}

		variantListSorting[i].s = v
		variantListSorting[i].i = variantIndex
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

//nolint:nonamedreturns // ...
func formatClassName(
	className string, config *TConfig, regexps TRegexps, orderList TOrderList, groupNameList []string, specialCases *TSpecialCases,
) (isNonTailwindCSS, isBeforePseudoElement, isAfterPseudoElement bool, classNameWeighted TClassNameWeighted) {
	var (
		classNameConditionalReference   string
		classNameSorting                = className
		groupNameSorting                string
		classNameWeighing               = TClassNameWeighing{className, -1, -1, -1}
		conditionalClassnameSplitString string
		matchesConditionalClassName     *re.Match
		groupNameFoundIndexList         = []int{}
		classNameVariantSorted          []TClassNameVariantSorted
		toBreakLoop                     = false
		isConditionalClass              = false
		isMatch                         bool
		sl                              []string
		err                             error
	)

	classNameWeighted = TClassNameWeighted{className, "", -1}

	/* ---find css classes in conditional css - string doesn't start with [\dA-Za-z!@\-[] --- */
	isMatch, err = regexps.classStartCharacter.MatchString(classNameSorting)
	handleError(err, "formatClassName MatchString(classNameSorting)", true)

	if !isMatch && strings.Contains(classNameSorting, config.extensionRegex.ConditionalSplitCharacter) {
		isConditionalClass = true
	}

	if isConditionalClass {
		classNameSplitList := strings.Split(classNameSorting, config.extensionRegex.ConditionalSplitCharacter)

		switch config.extensionRegex.ConditionalClassLocation {
		case "before":
			conditionalClassnameSplitString = classNameSplitList[0]

		case "after":
			conditionalClassnameSplitString = classNameSplitList[1]

		default:
			handleError(makeError("never"), "not expected values `before` | `after`", true)
		}

		matchesConditionalClassName, err = regexps.conditionalClassName.FindStringMatch(conditionalClassnameSplitString)
		handleError(err, "formatClassName FindStringMatch(conditionalClassnameSplitString)", true)

		for matchesConditionalClassName != nil {
			s := matchesConditionalClassName.String()

			s = s[1 : len(s)-1]

			if s != "" {
				classNameConditionalReference = s
				classNameSorting = s

				break
			}

			matchesConditionalClassName, err = regexps.conditionalClassName.FindNextMatch(matchesConditionalClassName)
			handleError(err, "formatClassName FindNextMatch(matchesConditionalClassName)", true)
		}
	}

	/* ---remove className variants--- */
	isMatch, err = regexps.variant.MatchString(classNameSorting)
	handleError(err, "formatClassName MatchString(classNameSorting)", true)

	if isMatch {
		sl = strings.Split(classNameSorting, ":")
		classNameSorting = sl[len(sl)-1]
	}

	/* ---remove "!" from classNameSorting starting with "!"--- */
	classNameSorting = cleanup(classNameSorting, []string{"!"}, false)

	/* ---preparing for className for groupNameSorting--- */
	groupNameSorting = classNameSorting

	/* ---remove ["!", "-", "no-", "not-", "min-", "max-", "auto-"] for groupNameSorting--- */
	groupNameSorting = cleanup(groupNameSorting, []string{"!", "-", "no-", "not-", "min-", "max-", "auto-"}, false)

	/* ---remove group / peer differentiator (eg: group/{name} | peer/{name})--- */
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

	lastIndex_groupNameFoundIndexList := len(groupNameFoundIndexList) - 1 //nolint:nolintlint,revive // ...

	for groupNameFoundIndex, groupNameIndex := range groupNameFoundIndexList {
		lastIndex_orderListGroupNameIndex := len(orderList[groupNameIndex].Regex) - 1 //nolint:nolintlint,revive // ...

		for classNameRegexIndex, classNameRegex := range orderList[groupNameIndex].Regex {
			r := re.MustCompile("^"+classNameRegex+"$", re.None)

			isMatch, err = r.MatchString(classNameSorting)
			handleError(err, "formatClassName MatchString(classNameSorting)", true)

			if isMatch {
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
		matchesConditionalClassName, err = regexps.conditionalClassName.FindStringMatch(conditionalClassnameSplitString)
		handleError(err, "formatClassName FindStringMatch(conditionalClassnameSplitString)", true)

		if matchesConditionalClassName != nil {
			s := matchesConditionalClassName.String()

			s = s[1 : len(s)-1]
			classNameVariantSorted = append(classNameVariantSorted, TClassNameVariantSorted{original: s, sorted: "", sl: []string{}})

			switch strings.Contains(s, ":") {
			case true:
				classNameVariantSorted[0].sl = strings.Split(s, ":")

			case false:
				classNameVariantSorted[0].sl = []string{s}

			default:
				handleError(makeError("never"), "not expected values `true` | `false`", true)
			}
		}

		if config.extensionRegex.ConditionalClassLocation == "after" {
			for matchesConditionalClassName != nil {
				matchesConditionalClassName, err = regexps.conditionalClassName.FindNextMatch(matchesConditionalClassName)
				handleError(err, "formatClassName FindNextMatch(matchesConditionalClassName)", true)

				if matchesConditionalClassName != nil {
					s := matchesConditionalClassName.String()

					s = s[1 : len(s)-1]
					classNameVariantSorted = append(classNameVariantSorted, TClassNameVariantSorted{original: s, sorted: "", sl: []string{}})

					i := len(classNameVariantSorted) - 1

					switch strings.Contains(s, ":") {
					case true:
						sl = strings.Split(s, ":")
						classNameVariantSorted[i].sl = sl

					case false:
						classNameVariantSorted[i].sl = []string{s}

					default:
						handleError(makeError("never"), "not expected values `true` | `false`", true)
					}
				}
			}
		}

	case false:
		classNameVariantSorted = append(classNameVariantSorted, TClassNameVariantSorted{original: className, sorted: "", sl: []string{}})

		switch strings.Contains(className, ":") {
		case true:
			sl = strings.Split(className, ":")
			classNameVariantSorted[0].sl = sl

		case false:
			classNameVariantSorted[0].sl = []string{className}

		default:
			handleError(makeError("never"), "not expected values `true` | `false`", true)
		}

	default:
		handleError(makeError("never"), "not expected values `true` | `false`", true)
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
						toBreakLoop = false //nolint:ineffassign,wastedassign // ...

						break
					}

					weight := index + 1

				SWITCH_LABEL: //nolint:gocritic // ...
					switch {
					case slices.Contains(sl, breakpoint):
						classNameWeighing.breakpointOrderWeight = weight * config.breakpointOrderWeightMultiplier
						toBreakLoop = true

					// @[*]/* | @[*]
					case strings.Index(breakpoint, "@[") == 0:
						s := ""

						for _, v1 := range sl {
							if strings.Index(v1, "@[") == 0 {
								s = "@[*]"

								if strings.Contains(v1, "/") {
									s += "/*"
								}
							}

							if s != "" {
								break
							}
						}

						if s != "" && s == breakpoint {
							classNameWeighing.breakpointOrderWeight = weight * config.breakpointOrderWeightMultiplier
							toBreakLoop = true
						}

					// @3xs/* | ... | @7xl/*
					case strings.Index(breakpoint, "@") == 0:
						s := ""

						for _, v1 := range sl {
							if strings.Index(v1, "@") == 0 && strings.Contains(v1, "/") {
								s = strings.Split(v1, "/")[0] + "/*"
							}

							if s != "" {
								break
							}
						}

						if s != "" && s == breakpoint {
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

					default:
						break SWITCH_LABEL
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
	isNonTailwindCSS = false
	isBeforePseudoElement = false
	isAfterPseudoElement = false

	switch classNameWeighing.groupNameIndex {
	case -1:
		isNonTailwindCSS = true

		return isNonTailwindCSS, isBeforePseudoElement, isAfterPseudoElement, TClassNameWeighted{"", "", -1}

	default:
		classNameWeighted.weight = classNameWeighing.groupNameIndex + classNameWeighing.groupOrderWeight + classNameWeighing.breakpointOrderWeight
		classNameWeighted.sorted = className

		isMatch, err = regexps.before.MatchString(className)
		handleError(err, "before.MatchString(className)", true)

		if isMatch {
			isBeforePseudoElement = true

			return isNonTailwindCSS, isBeforePseudoElement, isAfterPseudoElement, classNameWeighted
		}

		isMatch, err = regexps.after.MatchString(className)
		handleError(err, "after.MatchString(className)", true)

		if isMatch {
			isAfterPseudoElement = true

			return isNonTailwindCSS, isBeforePseudoElement, isAfterPseudoElement, classNameWeighted
		}

		return isNonTailwindCSS, isBeforePseudoElement, isAfterPseudoElement, classNameWeighted
	}
}

func formatRegion(
	region TRegion, config *TConfig, regexps TRegexps, orderList TOrderList, groupNameList []string, specialCases *TSpecialCases,
) string {
	var (
		classList                                       = []string{}
		beforePseudoWeightedList TClassNameWeightedList = []TClassNameWeighted{}
		afterPseudoWeightedList  TClassNameWeightedList = []TClassNameWeighted{}
		classNameWeightedList    TClassNameWeightedList = []TClassNameWeighted{}
		nonTailwindCSS                                  = ""
		beforePseudoSorted                              = strings.Builder{}
		afterPseudoSorted                               = strings.Builder{}
		classSorted                                     = strings.Builder{}
		output                                          = ""
		matches                  *re.Match
		err                      error
	)

	/* ---find css classes in region --- */
	matches, err = regexps.class.FindStringMatch(region.classesOriginal)
	handleError(err, "formatRegion FindStringMatch(region.classesOriginal)", true)

	for matches != nil {
		classList = append(classList, matches.String())
		matches, err = regexps.class.FindNextMatch(matches)
		handleError(err, "formatRegion FindNextMatch(matches)", true)
	}

	/* ---
	-> get css class order weight
	-> add in groupedWeightedClassList
	--- */
	for _, className := range classList {
		className = strings.TrimSpace(className)

		isNonTailwindCSS, isBeforePseudoElement, isAfterPseudoElement, classNameWeighted := formatClassName(className, config, regexps, orderList, groupNameList, specialCases)

		/* ---add className to non-tailwindcss list or weighted list--- */
		switch {
		case isNonTailwindCSS:
			switch nonTailwindCSS {
			case "":
				nonTailwindCSS = className

			default:
				nonTailwindCSS = nonTailwindCSS + config.extensionRegex.Separator + className
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
			_, err = beforePseudoSorted.WriteString(v.sorted)
			handleError(err, "error out.writeString", true)

			if i < lastIndex {
				_, err = beforePseudoSorted.WriteString(config.extensionRegex.Separator)
				handleError(err, "error out.writeString", true)
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
			_, err = afterPseudoSorted.WriteString(v.sorted)
			handleError(err, "error out.writeString", true)

			if i < lastIndex {
				_, err = afterPseudoSorted.WriteString(config.extensionRegex.Separator)
				handleError(err, "error out.writeString", true)
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
			_, err = classSorted.WriteString(v.sorted)
			handleError(err, "error out.writeString", true)

			if i < lastIndex {
				_, err = classSorted.WriteString(config.extensionRegex.Separator)
				handleError(err, "error out.writeString", true)
			}
		}
	}

	if config.extensionRegex.Separator != " " {
		output = config.extensionRegex.Separator
	}

	switch config.nonTailwindcssPlacement {
	case "front":
		output += nonTailwindCSS

		if output != "" && beforePseudoSorted.String() != "" {
			output += config.extensionRegex.Separator
		}

		output += beforePseudoSorted.String()

		if output != "" && afterPseudoSorted.String() != "" {
			output += config.extensionRegex.Separator
		}

		output += afterPseudoSorted.String()

		if output != "" && classSorted.String() != "" {
			output += config.extensionRegex.Separator
		}

		output += classSorted.String()

	case "back":
		output += classSorted.String()

		if output != "" && beforePseudoSorted.String() != "" {
			output += config.extensionRegex.Separator
		}

		output += beforePseudoSorted.String()

		if output != "" && afterPseudoSorted.String() != "" {
			output += config.extensionRegex.Separator
		}

		output += afterPseudoSorted.String()

		if output != "" && nonTailwindCSS != "" {
			output += config.extensionRegex.Separator
		}

		output += nonTailwindCSS

	default:
		handleError(makeError("never"), "not expected values `front` | `back`", true)
	}

	return output
}

// "fp" abbreviation for filepath
func format(
	fp, extension, code string, isCodeInput, isRegionInput bool, config *TConfig, regexps TRegexps, specialCases *TSpecialCases, orderList TOrderList, groupNameList []string, wg *sync.WaitGroup, isAsync bool, //nolint:nolintlint,revive,unparam,unused // ...
) {
	var (
		err        error
		regionList TRegionList
		start      string
		end        string
		encoder    *json.Encoder
		buffer     bytes.Buffer
		sl         []string
		matches    *re.Match
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
		err = json.Unmarshal([]byte(code), &sl)
		handleError(err, "format json.Unmarshal", true)

		switch len(sl) {
		case 0:
			handleError(
				makeError("\"--region-input\" flag is set and \"--stdin\" is not base64-encoded json array of regions (strings)"),
				"input error",
				false,
			)

		default:
			for _, v := range sl {
				regionList = append(regionList, TRegion{v, "", -1, -1})
			}
		}

	case false:
		matches, err = regexps.region.FindStringMatch(code)
		handleError(err, "format region.FindStringMatch(code)", true)

		for matches != nil {
			regionList = append(regionList, TRegion{matches.String(), "", matches.RuneIndex, matches.RuneLength})
			matches, err = regexps.region.FindNextMatch(matches)
			handleError(err, "format region.FindNextMatch(matches)", true)
		}

	default:
		handleError(makeError("never"), "not expected values `true` | `false`", true)
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

		default:
			handleError(makeError("never"), "not expected values `true` | `false`", true)
		}

		regionIndex--
	}

	/* ---print to stdout | write to file--- */
	switch {
	case isCodeInput && isRegionInput:
		encoder = json.NewEncoder(&buffer)
		encoder.SetEscapeHTML(false)

		err = encoder.Encode(sl)
		handleError(err, "format Encode()", true)

		_, err = fmt.Println(encodeBase64(buffer.Bytes(), true, true)) //nolint:forbidigo // ...
		handleError(err, "format encodeBase64()", true)

	case isCodeInput && !isRegionInput:
		_, err = fmt.Println(encodeBase64([]byte(code), true, true)) //nolint:forbidigo // ...
		handleError(err, "format encodeBase64()", true)

	case !isCodeInput:
		writeFile([]byte(code), fp, true, false, false)

	default:
		break //nolint:nolintlint,revive // ...
	}
}

func formatCommand(isBase64Config, isEmbeddedConfig, isRegionInput bool, code, codeExt string, filepaths []string, configRaw string) {
	var (
		configByte      []byte
		configInput     TConfigInput
		orderList       TOrderList
		groupNameList   = []string{}
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
	err = json.Unmarshal(jsonc.ToJSON(orderListDefault), &defaultOrderMap)
	handleError(err, "formatCommand Unmarshal()", true)

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
		nonTailwindcssPlacement:         configInput.NonTailwindcssPlacement,
		orderType:                       configInput.OrderType,
		breakpointGrouping:              configInput.BreakpointGrouping,
		variantOrdering:                 configInput.VariantOrdering,
		breakpointOrder:                 configInput.BreakpointOrder,
		breakpointOrderWeightMultiplier: 0,
		extensionRegex: TExtensionRegex{
			Region:                    "",
			Class:                     "",
			ConditionalSplitCharacter: "?",
			ConditionalClassLocation:  "after",
			Separator:                 " ",
		},
	}

	/* ---define breakpointOrderWeightMultiplier--- */
	switch config.breakpointGrouping {
	case "style":
		config.breakpointOrderWeightMultiplier = 1

	case "breakpoint":
		config.breakpointOrderWeightMultiplier = 100000000

	default:
		handleError(makeError("never"), "not expected values `style` | `breakpoint`", true)
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
	case code != "" && codeExt != "":
		if extensionRegex, ok = configInput.ExtensionsRegex[codeExt]; !ok {
			err = makeError("cannot find \"--ext\" in \"extensions_regex\" config option")
			handleError(err, "flags error", true)
		}

		codeByte, _ = decodeBase64(code, true, false)
		config.extensionRegex = extensionRegex
		format("", codeExt, string(codeByte), true, isRegionInput, &config, regexps, &specialCases, orderList, groupNameList, &wg, false)

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
				format(v, extension, string(codeByte), false, false, &config, regexps, &specialCases, orderList, groupNameList, &wg, false)

			default:
				wg.Add(1)

				go format(v, extension, string(codeByte), false, false, &config, regexps, &specialCases, orderList, groupNameList, &wg, true)
			}
		}

		wg.Wait()

	default:
		break //nolint:nolintlint,revive // ...
	}
}
