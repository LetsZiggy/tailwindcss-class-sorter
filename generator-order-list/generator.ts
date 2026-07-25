/* eslint-disable @stylistic/array-element-newline, @stylistic/no-tabs */

import { exec } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { promisify } from "node:util"
import defaults from "./defaults-list.json" with { type: "json" }
import { normaliseCompareResult, skipStylesGroupsColourRemove } from "./helper.js" // sorting
import type { NonEmptyArray } from "./helper.js"
import type { StylelintConfigOrder } from "./stylelint-config-order.js"

const r = String.raw

interface MergeList { include: string[], exclude: string[], regex: NonEmptyArray<string> }
export interface OrderData {
	group_name: string,
	regex: string[],
}
interface SortedClassnames {
	others: string[],
	[key: string]: string[],
}
type CompareFunction<T> = (a: T, b: T) => number

// Ensure colours are grouped together
const colourList = [
	...defaults["colour-absolute"]
		.filter((current) => current === "white")
		.map((current) => [
			`-${ current }`,
			r`-${ current }\/\d{1,4}`,
		])
		.flat(Infinity),
	...defaults["colour-relative"]
		.filter((current) => current === "red")
		.map((current) => [
			`-${ current }-`,
			r`-${ current }-\d{1,4}`,
			r`-${ current }-\d{1,4}\/\d{1,4}`,
		])
		.flat(Infinity),
] as NonEmptyArray<string>
// const colourRegex = new RegExp(r`-(?<!\()(?:${
// 	colourList
// 		.map((current) => `(?:${ current.replaceAll(/^-/g, "").toLowerCase() })`)
// 		.join("|")
// })(?![0-9A-Za-z]|\))`)
const colourWhite = "-white"
const colourWhiteRegex = /-white/
const colourAbsoluteList = `-(?:${ defaults["colour-absolute"].map((current) => `(?:${ current.toLowerCase() })`).join("|") })`
const colourRed = "-red-"
const colourRedRegex = /-red-/
const colourRelativeList = `-(?:${ defaults["colour-relative"].map((current) => `(?:${ current.toLowerCase() })`).join("|") })-`

const lineHeight = defaults["line-height"].map((current) => `-${ current }`) as NonEmptyArray<string>
const fontWeight = defaults["font-weight"].map((current) => `-${ current }`) as NonEmptyArray<string>
const letterSpacing = defaults["letter-spacing"].map((current) => `-${ current }`) as NonEmptyArray<string>
const digits = [r`-\d{1,4}`, r`-\d{1,4}\/\d{1,4}`, r`-\d{1,4}\%`] as NonEmptyArray<string>
const units = [
	"-none", "-auto", "-initial", "-full", "-screen", "-fit", "-min", "-max", "-fr", "-px",
	"-vh", "-vw", "-dvw", "-dvh", "-svw", "-svh", "-lvw", "-lvh", "-lh",
	r`-\d{1,4}xs`, "-xs",
	"-sm", "-base", "-md", "-lg",
	"-xl", r`-\d{1,4}xl`,
] as NonEmptyArray<string>
const sizes = [
	"-none", "-auto", "-initial", "-reverse", "-full", "-fr", "-px",
	r`-\d{1,4}xs`, "-xs", r`-xs\/\d{1,4}`,
	"-sm", r`-sm\/\d{1,4}`,
	"-base", r`-base\/\d{1,4}`, "-md",
	"-lg", r`-lg\/\d{1,4}`,
	"-xl", r`-xl\/\d{1,4}`, r`-\d{1,4}xl`, r`-\d{1,4}xl\/\d{1,4}`,
] as NonEmptyArray<string>
const customs = [r`-\([^\)]+\)`, r`-\[[^\]]+\]`] as NonEmptyArray<string>
const mergeLists: MergeList[] = [
	{ include: [], exclude: [], regex: [".start", ".end"] }, // Deprecated: https://github.com/tailwindlabs/tailwindcss/pull/19613
	{ include: [], exclude: [], regex: [".from", ".via", ".to"] },
	{ include: [], exclude: [], regex: [".form"] },
	{ include: [], exclude: [], regex: [".prose"] },
	{ include: [], exclude: [], regex: [".top", ".right", ".bottom", ".left"] },
	{ include: [], exclude: [], regex: [".p", ".ps", ".pe", ".px", ".py", ".pt", ".pr", ".pb", ".pl"] },
	{ include: [], exclude: [], regex: [".m", ".ms", ".me", ".mx", ".my", ".mt", ".mr", ".mb", ".ml"] },
	{ include: lineHeight, exclude: [], regex: lineHeight },
	{ include: fontWeight, exclude: [], regex: fontWeight },
	{ include: letterSpacing, exclude: [], regex: letterSpacing },
	{ include: ["-dashed", "-dotted", "-double", "-solid"], exclude: [], regex: ["-none", "-from-", "-dashed", "-dotted", "-double", "-solid", "-wavy"] },
	{ include: ["-light", "-dark"], exclude: [], regex: ["-normal", "-light", "-light-", "-dark", "-dark-"] },
	{ include: ["-ultra-condensed", "-extra-condensed", "-semi-condensed", "-semi-expanded", "-extra-expanded", "-ultra-expanded"], exclude: [], regex: ["-ultra-condensed", "-extra-condensed", "-condensed", "-semi-condensed", "-normal", "-semi-expanded", "-expanded", "-extra-expanded", "-ultra-expanded"] },
	{ include: ["-before-", "-inside-", "-after-"], exclude: [], regex: ["-before-", "-inside-", "-after-"] },
	{ include: ["-columns"], exclude: ["-column", "-cols", "-col"], regex: ["-rows", "-rows-", "-columns", "-columns-"] },
	{ include: ["-columns-"], exclude: ["-column-", "-cols-", "-col-"], regex: ["-rows", "-rows-", "-columns", "-columns-"] },
	{ include: ["-column"], exclude: ["-cols", "-col", "-columns"], regex: ["-row", "-row-", "-column", "-column-"] },
	{ include: ["-column-"], exclude: ["-cols-", "-col-", "-columns-"], regex: ["-row", "-row-", "-column", "-column-"] },
	{ include: ["-cols"], exclude: ["-col", "-columns", "-column"], regex: ["-rows", "-rows-", "-cols", "-cols-"] },
	{ include: ["-cols-"], exclude: ["-col-", "-columns-", "-column-"], regex: ["-rows", "-rows-", "-cols", "-cols-"] },
	{ include: ["-col"], exclude: ["-columns", "-column", "-cols"], regex: ["-row", "-row-", "-col", "-col-"] },
	{ include: ["-col-"], exclude: ["-columns-", "-column-", "-cols-"], regex: ["-row", "-row-", "-col", "-col-"] },
	{ include: ["-right-top", "-right-bottom", "-left-bottom", "-left-top"], exclude: ["-center-", "-down", "-end", "-footer"], regex: ["-none", "-initial", "-auto", "-both", "-center", "-top", "-top-right", "-right-top", "-right", "-bottom-right", "-right-bottom", "-bottom", "-bottom-left", "-left-bottom", "-left", "-top-left", "-left-top", ...customs] }, // Deprecated: https://github.com/tailwindlabs/tailwindcss/pull/<17378,17437>
	{ include: ["-top-right", "-top-left", "-bottom-right", "-bottom-left"], exclude: ["-center-", "-down", "-end", "-footer"], regex: ["-none", "-initial", "-auto", "-both", "-center", "-top", "-top-right", "-right-top", "-right", "-bottom-right", "-right-bottom", "-bottom", "-bottom-left", "-left-bottom", "-left", "-top-left", "-left-top", ...customs] }, // Deprecated: https://github.com/tailwindlabs/tailwindcss/pull/<17378,17437>
	{ include: ["-center", "-top", "-right", "-bottom", "-left"], exclude: ["-down", "-end", "-footer"], regex: ["-center", "-center-", "-top", "-top-", "-right", "-right-", "-bottom", "-bottom-", "-left", "-left-"] },
	{ include: ["-stretch"], exclude: [], regex: ["-initial", "-auto", "-both", "-around", "-baseline", "-baseline-", "-between", "-evenly", "-normal", "-stretch", "-start", "-center", "-center-", "-end", "-end-"] },
	{ include: ["-start", "-end", "-right", "-left"], exclude: ["-start-", "-end-", "-right-", "-left-"], regex: ["-none", "-initial", "-auto", "-both", "-justify", "-start", "-end", "-right", "-center", "-left"] },
	{ include: ["-header", "-footer"], exclude: ["-right", "-down", "-bottom", "-end"], regex: ["-header", "-header-", "-center", "-center-", "-footer", "-footer-"] },
	{ include: ["-header-", "-footer-"], exclude: ["-header", "-footer"], regex: ["-header-", "-center-", "-footer-"] },
	{ include: ["-right", "-left"], exclude: ["-down", "-bottom", "-end", "-footer"], regex: ["-right", "-right-", "-center", "-center-", "-left", "-left-"] },
	{ include: ["-right-", "-left-"], exclude: ["-right", "-left"], regex: ["-right-", "-center-", "-left-"] },
	{ include: ["-up", "-down"], exclude: ["-bottom", "-end", "-footer", "-right"], regex: ["-up", "-up-", "-center", "-center-", "-down", "-down-"] },
	{ include: ["-up-", "-down-"], exclude: ["-up", "-down"], regex: ["-up-", "-center-", "-down-"] },
	{ include: ["-top", "-bottom"], exclude: ["-end", "-footer", "-right", "-down"], regex: ["-baseline", "-sub", "-super", "-top", "-top-", "-center", "-center-", "-middle", "-bottom", "-bottom-"] },
	{ include: ["-top-", "-bottom-"], exclude: ["-top", "-bottom"], regex: ["-top-", "-center-", "-bottom-"] },
	{ include: ["-start", "-end"], exclude: ["-footer", "-right", "-down", "-bottom"], regex: ["-start", "-start-", "-center", "-center-", "-end", "-end-"] },
	{ include: ["-start-", "-end-"], exclude: ["-start", "-end"], regex: ["-start-", "-center-", "-end-"] },
	{ include: ["-nesw-", "-nwse-"], exclude: [], regex: ["-nesw-", "-nwse-", "-ns-", "-ew-", "-n-", "-ne-", "-e-", "-se-", "-s-", "-sw-", "-w-", "-nw-"] },
	{ include: ["-ss-", "-ee-", "-s-", "-e-"], exclude: ["-nesw-", "-nwse-"], regex: ["-s-", "-e-", "-ss-", "-se-", "-ee-", "-es-", "-t-", "-tl-", "-l-", "-bl-", "-b-", "-br-", "-r-", "-tr-"] },
	{ include: ["-ss-", "-ee-"], exclude: ["-s-", "-e-"], regex: ["-ss-", "-se-", "-ee-", "-es-", "-tl-", "-bl-", "-br-", "-tr-"] },
	{ include: ["-s-", "-e-"], exclude: ["-nesw-", "-nwse-"], regex: ["-s", "-s-", "-e", "-e-"] },
	{ include: [], exclude: [], regex: ["-p-", "-ps-", "-pe-", "-px-", "-py-", "-pt-", "-pr-", "-pb-", "-pl-"] },
	{ include: [], exclude: [], regex: ["-m-", "-ms-", "-me-", "-mx-", "-my-", "-mt-", "-mr-", "-mb-", "-ml-"] },
	{ include: ["-x", "-x-", "-y", "-y-"], exclude: [], regex: ["-x", "-x-", "-y", "-y-"] },
	{ include: ["-x", "-y"], exclude: ["-x-", "-y-"], regex: ["-x", "-y"] },
	{ include: ["-x-", "-y-"], exclude: ["-x", "-y"], regex: ["-x-", "-y-"] },
	{ include: ["-tr", "-br", "-bl", "-tl"], exclude: [], regex: ["-none", "-initial", "-auto", "-both", "-t", "-tr", "-r", "-br", "-b", "-bl", "-l", "-tl"] },
	{ include: ["-t-", "-l-"], exclude: [], regex: ["-t", "-t-", "-r", "-r-", "-b", "-b-", "-l", "-l-"] },
	{ include: ["-t-", "-b-"], exclude: ["-r-", "-l-"], regex: ["-t-", "-b-"] },
	{ include: ["-r-", "-l-"], exclude: ["-t-", "-b-"], regex: ["-r-", "-l-"] },
	{ include: ["-first", "-last"], exclude: [], regex: ["-none", "-initial", "-auto", "-both", "-first", "-last", ...digits, ...customs] },
	{ include: ["-min", "-max"], exclude: [], regex: ["-none", "-initial", "-auto", "-both", "-fr", "-min", "-max"] },
	{ include: ["-none"], exclude: [], regex: ["-none", "-initial", "-auto", "-manual", "-both", "-contain"] },
	{ include: [colourWhite, colourRed], exclude: [], regex: colourList },
	{ include: ["-dvw", "-dvh", "-svw", "-svh", "-lvw", "-lvh"], exclude: [], regex: [...units, ...digits, ...customs] },
	{ include: [], exclude: [], regex: [...sizes, ...digits, ...customs] },
]
const classnamePrefix = new Set<string>(["no", "not", "min", "max", "auto"])

const asyncExec = promisify(exec)

export async function generator (configOrder: StylelintConfigOrder, source: string, stylelintrcPath: string): Promise<Record<"order", OrderData[]>> {
	await writeFile(stylelintrcPath, `export default ${ JSON.stringify(configOrder.config) }`, { encoding: "utf8", flag: "w" })
	await asyncExec(`./node_modules/.bin/stylelint ${ source } --config ${ stylelintrcPath } --fix`)

	const sourceData: string[] | undefined = await readFile(source, { encoding: "utf8", flag: "r" })
		.then((string_: string) => string_.split("\n"))
		.catch((error: Error) => {
			throw new Error(`${ error.name }: ${ error.message }`)
		})

	const propertyOrder = Object.keys(configOrder.order)

	if (propertyOrder.length === 0) {
		throw new Error(`"order" is empty`)
	}

	// Sort classes according to their first non-custom property
	const css: SortedClassnames = sourceData.reduce<SortedClassnames>((accumulator, current): SortedClassnames => {
		let isFound = false

		for (const property of propertyOrder) {
			if (current.includes(` ${ property }: `)) {
				accumulator[property]!.push(current)
				isFound = true

				break
			}
		}

		if (!isFound) {
			accumulator.others.push(current)
		}

		return accumulator
	}, { ...configOrder.order, others: [] })

	// Ensure more specific classes comes first (with more style properties)
	// Ensure letters comes before numbers
	/* ... */

	/* */
	// Ensure classes are `https://github.com/dlclark/regexp2` regex compatible
	for (const property of [...propertyOrder, "others"]) {
		css[property] = css[property]!
			.map((current) => current
				.split(" {")[0]! // Remove all but class names //-- current.includes(" >") ? " >" : " {" --//
				.slice(1) // Removes dot (css class identifier)
				// .replaceAll("\\", "\\") // Escape backslash in css names - NEED TO RE-EVALUATE REGEX
				.replaceAll(/\d+/g, r`\d{1,4}`) // Replace numbers to \d{1,4}
				// .replace(screenRegex, `-(${ screenList })`)
				// .replace(cornerWordVerticalInsetRegex, `-(${ cornerWordVerticalList })-`)
				// .replace(cornerWordVerticalEndRegex, `-(${ cornerWordVerticalList })`)
				// .replace(cornerWordHorizontalInsetRegex, `-(${ cornerWordHorizontalList })-`)
				// .replace(cornerWordHorizontalEndRegex, `-(${ cornerWordHorizontalList })`)
				// .replace(cornerLetterInsetRegex, `-(${ cornerLetterList })-`)
				// .replace(cornerLetterEndRegex, `-(${ cornerLetterList })`)
				// .replace(cornerLogicalLetterInsetRegex, `-(${ cornerLogicalLetterList })-`)
				// .replace(cornerLogicalLetterEndRegex, `-(${ cornerLogicalLetterList })`)
				// .replace(directionWordInsetRegex, `-(${ directionWordList })-`)
				// .replace(directionWordEndRegex, `-(${ directionWordList })`)
				// .replace(directionLetterInsetRegex, `-(${ directionLetterList })-`)
				// .replace(directionLetterEndRegex, `-(${ directionLetterList })`)
				// .replace(directionLogicalLetterInsetRegex, `-(${ directionLogicalLetterList })-`)
				// .replace(directionLogicalLetterEndRegex, `-(${ directionLogicalLetterList })`)
				// .replace(rowcolPluralInsetRegex, `-(${ rowcolPluralList })-`)
				// .replace(rowcolPluralEndRegex, `-(${ rowcolPluralList })`)
				// .replace(rowcolSingularInsetRegex, `-(${ rowcolSingularList })-`)
				// .replace(rowcolSingularEndRegex, `-(${ rowcolSingularList })`)
				// .replace(startendInsetRegex, `-(${ startendList })-`)
				// .replace(startendEndRegex, `-(${ startendList })`)
				// .replace(xyInsetRegex, `-(${ xyList })-`)
				// .replace(xyEndRegex, `-(${ xyList })`)
				// .replace(colourAbsoluteRegex, `-(${ colourAbsoluteList })`)
				// .replace(colourRelativeRegex, `-(${ colourRelativeList })`)
				// .replace(fontWeightRegex, `-(${ fontWeightList })`)
				// .replace(letterSpacingRegex, `-(${ letterSpacingList })`)
				// .replace(lineHeightRegex, `-(${ lineHeightList })`)
				// .replace(fontSizeShorthandRegex, r`-(${ fontSizeList })\/((${ lineHeightListNumber })|(\[\d{1,4}[A-Za-z]{1,4}\])){0,1}`)
				.replace(/-\\\([^)]+\\\)/, r`-\([^\)]+\)`) // Replace `-(--custom-property-placeholder)`
				.replace(/-\\\[[^)]+?\\\]/, r`-\[[^\]]+\]`), // Replace `-\\[--value-placeholder\\]`
				// --- ESCAPE HATCHES --- //
				// .replace(r`scale-\d{1,4}d`, "scale-3d") // https://tailwindcss.com/docs/scale
				// .replace(r`transform-\d{1,4}d`, "transform-3d"), // https://tailwindcss.com/docs/transform-style
				// --- ESCAPE HATCHES --- //
			) // eslint-disable-line @stylistic/function-paren-newline
			.map((current) => (current.startsWith("-")
				? `-{0,1}${ current.slice(1) }`
				: current)) // Add optional negative `-{0,1}` for classes with negative prefix
			.map((current) => (
				(
					!current.startsWith("-{0,1}")
					&& current.includes(r`\d`)
					&& !current.includes(colourWhite)
					&& !current.includes(colourRed)
				)
					? `-{0,1}${ current }`
					: current)) // Add optional negative `-{0,1}` for classes with numbers that are not colours
			.filter((current, _, array) => !(!current.startsWith("-{0,1}") && array.includes(`-{0,1}${ current }`))) // Remove redundant classes after adding optional negative `-{0,1}`
			.filter((current) => current !== "") // Remove empty strings
	}

	// Ensure less hyphens comes before more hyphens
	// Ensure letters comes before numbers
	// Ensure classes are sorted alphabetically
	/* ... */

	// Ensure letters comes before numbers
	// Ensure classes are sorted alphabetically
	/* ... */

	// Flatten sorted arrays
	const classnames: NonEmptyArray<string> = applyMergeLists([
		...new Set([...propertyOrder, "others"].reduce<string[]>((accumulator, current) => [...accumulator, ...css[current]!], [])),
	] as unknown as NonEmptyArray<string>)

	// Convert to `OrderData` format
	let list: OrderData[] = classnames
		.reduce<OrderData[]>((accumulator, current) => {
			const string_: string[] = current
				.slice((current.startsWith("-{0,1}")) ? 6 : 0)
				.split("-")
			const groupname: string = string_.at(classnamePrefix.has(string_.at(0)!) ? 1 : 0)!

			// Group similar classes for quicker matches using list of lists
			switch (groupname) {
				case accumulator?.at(-1)?.group_name: {
					accumulator.at(-1)!.regex.push(current)

					break
				}

				default: {
					accumulator.push({ group_name: groupname, regex: [current] })
				}
			}

			return accumulator
		}, [])

	// Reorder defaultStyleOrder
	list = reorderMoveToTop(
		[
			{ group_name: "dark", regex: ["dark"] },
			{ group_name: "group", regex: ["group", r`group/[\dA-Za-z]{1,}`] },
			{ group_name: "peer", regex: ["peer", r`peer/[\dA-Za-z]{1,}`] },
			{ group_name: "@container", regex: ["@container", "@container-normal", r`@container/[\dA-Za-z]{1,}`] }, // Added back in from prepare-css
			{ group_name: "prose", regex: ["prose", "not-prose", "prose-invert"] },
			...list,
		],
		[
			{ groupname: "@container", include: "@container" },
			{ groupname: "dark", include: "dark" },
			{ groupname: "group", include: "group" },
			{ groupname: "peer", include: "peer" },
			{ groupname: "form", include: "form-checkbox" },
			{ groupname: "prose", include: "prose" },
			{ groupname: "sr", include: "sr-only" },
		],
	)
	// Reorder positionStyleOrder
	list = reorderMoveToGroupname(list, [
		{ groupname: "static", include: "static" },
		{ groupname: "absolute", include: "absolute" },
		{ groupname: "relative", include: "relative" },
		{ groupname: "fixed", include: "fixed" },
		{ groupname: "sticky", include: "sticky" },
	])
	// Reorder positionXYOrder
	list = reorderMoveToGroupname(list, [
		{ groupname: "inset", include: "inset-auto" },
		{ groupname: "top", include: "top-auto" },
		{ groupname: "right", include: "right-auto" },
		{ groupname: "bottom", include: "bottom-auto" },
		{ groupname: "left", include: "left-auto" },
		{ groupname: "z", include: "z-auto" },
	])
	// Reorder displayStyleOrder
	list = reorderMoveToGroupname(list, [
		{ groupname: "hidden", include: "hidden" },
		{ groupname: "inline", include: "inline" },
		{ groupname: "block", include: "block" },
		{ groupname: "flex", include: "flex" },
		{ groupname: "grid", include: "grid" },
		{ groupname: "table", include: "table" },
		{ groupname: "contents", include: "contents" },
		{ groupname: "flow", include: "flow-root" },
		{ groupname: "list", include: "list-item" },
	])
	// Reorder sizeStyleOrder
	list = reorderMoveToGroupname(list, [
		{ groupname: "container", include: "container" },
		{ groupname: "size", include: "size-auto" },
		{ groupname: "w", include: "w-auto" },
		{ groupname: "h", include: "h-auto" },
	])

	// Re-add colours (absolute | relative)
	const skipStyles = Object.values(skipStylesGroupsColourRemove)

	list = list
		.map((current) => {
			if (current.regex.some((current_) => skipStyles.some((skipStyle) => current_.startsWith(skipStyle)))) {
				return current
			}

			current.regex = current.regex.map((current_) => {
				if (current_.includes(colourWhite)) {
					current_ = current_.replace(colourWhiteRegex, colourAbsoluteList)
				}

				if (current_.includes(colourRed)) {
					current_ = current_.replace(colourRedRegex, colourRelativeList)
				}

				return current_
			})

			return current
		})
		.map((current) => {
			const group_name = current.group_name // eslint-disable-line @typescript-eslint/naming-convention
			const regex = applyMergeLists(current.regex as NonEmptyArray<string>)

			return ({ group_name, regex })
		})
		.map((current) => ({
			group_name: current.group_name,
			regex: current.regex.toSorted((a, b) => {
				// Sort classnames without hyphen before classnames with hyphen (eg `.prose` < `.prose-base`)
				const aIndex = getClassnameParts(a).classnameWithoutPrefix.includes("-") ? 0 : -1
				const bIndex = getClassnameParts(b).classnameWithoutPrefix.includes("-") ? 0 : -1

				if (aIndex !== 0 || bIndex !== 0) {
					const compareResult = normaliseCompareResult(aIndex - bIndex)

					if (compareResult !== 0) {
						return compareResult
					}
				}

				return 0
			}),
		}))

	return ({ order: list })
}

function applyMergeLists (classnamesRaw: NonEmptyArray<string>): NonEmptyArray<string> {
	// Find and group related classnames into an array
	const mergedIndices = new Set<number>()
	const merged: Array<string[] | string | undefined> = Array.from({ length: classnamesRaw.length }).map(() => undefined)
	const unmerged = new Set<string>()

	for (const mergeList of mergeLists) {
		ClassnamesRawLoop:
		for (const [index, classname] of classnamesRaw.entries()) {
			if (mergedIndices.has(index)) {
				continue ClassnamesRawLoop
			}

			const unmergeString = JSON.stringify([index, classname], undefined, "")
			const { classnameTrimmed, classnameWithoutPrefix, groupname, groupnameWithPrefix } = getClassnameParts(classname, mergeList)

			// Skip loop if classname has mergeList.exclude
			if (
				mergeList.exclude
		    .filter((current) => !current.endsWith("-"))
		    .some((current) => classname.endsWith(current))
		    || mergeList.exclude
		    .filter((current) => current.endsWith("-"))
		    .some((current) => classname.includes(current))
			) {
				unmerged.add(unmergeString)

				continue ClassnamesRawLoop
			}

			// Skip loop if classname not in mergeList.regex
			if (
				(
					mergeList.regex.at(0)!.startsWith(".")
					&& !mergeList.regex.includes(`.${ groupname.split("-").at(0)! }`)
				)
				|| (
					!mergeList.regex.at(0)!.startsWith(".")
					&& (
						!mergeList.regex
						.filter((current) => !current.endsWith("-"))
						.some((current) => classnameWithoutPrefix.endsWith(current))
						&& !mergeList.regex
						.filter((current) => current.endsWith("-"))
						.some((current) => (
							classnameWithoutPrefix.includes(current)
							&& `-${ classnameWithoutPrefix.split("-").at(0)! }-` !== current
						))
					)
				)
			) {
				unmerged.add(unmergeString)

				continue ClassnamesRawLoop
			}

			const { relatedClassnames, relatedIndices } = getRelatedClassnames(classnamesRaw, mergedIndices, mergeList, { index, classname, classnameTrimmed, groupname, groupnameWithPrefix })

			// Skip loop if no related classnames
			if (relatedIndices.length === 0 || relatedClassnames.length === 0) {
				unmerged.add(unmergeString)

				continue ClassnamesRawLoop
			}

			const indices = [index, ...relatedIndices]
			const classnames = [classname, ...relatedClassnames]

			// Skip loop if not every mergeList.include
			if (
				!(
					mergeList.include
					.filter((current) => !current.endsWith("-"))
					.every((currentEvery) => (
						classnames.some((currentSome) => currentSome.endsWith(currentEvery))
					))
					&& mergeList.include
					.filter((current) => current.endsWith("-"))
					.every((currentEvery) => (
						classnames.some((currentSome) => currentSome.includes(currentEvery))
					))
				)
			) {
				unmerged.add(unmergeString)

				continue ClassnamesRawLoop
			}

			indices.forEach(function (current) { mergedIndices.add(current) })// eslint-disable-line unicorn/no-array-for-each
			merged[index] = classnames.toSorted(sortClassnamesWrapper(mergeList))
			unmerged.delete(unmergeString)
		}
	}

	// Add in unmerged classnames
	const mergedSet = new Set(merged
		.filter((current) => current !== undefined)
		.flat(Infinity))

	;[...unmerged]
		.map((current) => JSON.parse(current) as [number, string])
		.filter((current) => !mergedSet.has(current[1]))
		.forEach((current) => { // eslint-disable-line unicorn/no-array-for-each
			let index = current[0]

			while (index < merged.length) {
				if (merged[index] === undefined) {
					merged[index] = current[1]

					break
				}

				index += 1
			}
		})

	return ([...new Set<string>(merged.filter((current) => current !== undefined).flat(Infinity) as string[])] as NonEmptyArray<string>)
}

function getClassnameParts (classname: string, mergeList?: MergeList): { classnameTrimmed: string, classnameWithoutPrefix: string, groupname: string, groupnameWithPrefix: string } {
	const classnameTrimmed = classname.slice(classname.startsWith("-{0,1}") ? 6 : 0)
	const prefix = classnamePrefix.has(classnameTrimmed.slice(0, classnameTrimmed.indexOf("-")))
		? `${ classnameTrimmed.slice(0, classnameTrimmed.indexOf("-")) }`
		: ""
	const classnameWithoutPrefix = (prefix === "")
		? classnameTrimmed
		: classnameTrimmed.slice(classnameTrimmed.indexOf("-"))
	let groupname = ""
	let groupnameWithPrefix = ""

	if (mergeList === undefined) {
		return ({ classnameTrimmed, classnameWithoutPrefix, groupname, groupnameWithPrefix })
	}

	let mergingString = ""

	// MergeList.regex starts with `.` (eg .from | .via | .to)
	if (mergeList.regex.at(0)!.startsWith(".")) {
		mergingString = mergeList.regex.reduce((accumulator, current) => {
			return (
				(classnameWithoutPrefix.includes("-"))
					// eg `.prose-base`
					? `.${ classnameWithoutPrefix }`.startsWith(`${ current }-`)
						? current
						: accumulator
					// eg `.prose`
					: `.${ classnameWithoutPrefix }` === current
						? current
						: accumulator
			)
		}, "")
	}
	// Checks for `-<regex>-` and `-<regex>`
	else {
		const check = { regexEnd: "", regexMiddle: "" }

		// Checks for `-<regex>`; get longest matching regex
		const mergingStringEnd = mergeList.regex
			.filter((current) => !current.endsWith("-"))
			.reduce((accumulator, current) => (classnameWithoutPrefix.endsWith(current) && current.length > accumulator.length) ? current : accumulator, "")

		if (mergingStringEnd !== "") {
			check.regexEnd = classnameWithoutPrefix.split(mergingStringEnd).at(0)!
		}

		// Checks for `-<regex>-`; get longest matching regex
		const mergingStringMiddle = mergeList.regex
			.filter((current) => current.endsWith("-"))
			.reduce((accumulator, current) => (classnameWithoutPrefix.includes(current) && current.length > accumulator.length) ? current : accumulator, "")

		if (mergingStringMiddle !== "") {
			check.regexMiddle = classnameWithoutPrefix.split(mergingStringMiddle).at(0)!
		}

		if ((check.regexEnd !== "" && check.regexMiddle !== "")) {
			mergingString = (check.regexEnd.length > check.regexMiddle.length)
				? mergingStringEnd
				: mergingStringMiddle
		}
		else {
			if (check.regexEnd !== "") {
				mergingString = mergingStringEnd
			}

			if (check.regexMiddle !== "") {
				mergingString = mergingStringMiddle
			}
		}
	}

	groupname = mergeList.regex.at(0)!.startsWith(".")
		? mergingString.replace(".", "").replace("-", "")
		: classnameWithoutPrefix.slice(0, classnameWithoutPrefix.includes(mergingString) ? classnameWithoutPrefix.indexOf(mergingString) : classnameWithoutPrefix.length)
	groupnameWithPrefix = (prefix === "")
		? groupname
		: `${ prefix }-${ groupname }`

	return ({ classnameTrimmed, classnameWithoutPrefix, groupname, groupnameWithPrefix })
}

function getRelatedClassnames (classnamesRaw: NonEmptyArray<string>, mergedIndices: Set<number>, mergeList: MergeList, reference: { index: number, classname: string, classnameTrimmed: string, groupname: string, groupnameWithPrefix: string }): { relatedIndices: number[], relatedClassnames: string[] } {
	const relatedIndices: number[] = []
	const relatedClassnames: string[] = []

	ClassnamesRawLoop:
	for (const [index, classname] of classnamesRaw.entries()) {
		const { classnameTrimmed, classnameWithoutPrefix, groupname, groupnameWithPrefix } = getClassnameParts(classname, mergeList)

		// classnameTrimmed equals to reference if trimmed and `sizes`.regex stripped from reference (eg `inset-ring` === `-{0,1}inset-ring-\\d{1,4}` after trimmed and stripped of regex)
		// excludes displayStyles
		if (
			mergeList.regex.includes(r`-base\/\d{1,4}`)
			&& groupnameWithPrefix === ""
			&& classnameTrimmed === reference.groupnameWithPrefix
			&& !["hidden", "inline", "block", "flex", "grid", "table", "contents", "flow-root", "list-item"].includes(classnameTrimmed)
		) {
			relatedIndices.push(index)
			relatedClassnames.push(classname)

			// No need go further down loop
			continue ClassnamesRawLoop
		}

		// Skip loop if classname not related to reference.groupname
		if (
			index === reference.index
			|| classname === reference.classname
			|| mergedIndices.has(index)
			|| relatedIndices.includes(index)
			// Check `-<regex>` | `-<regex>-`
			|| (
				!mergeList.regex.at(0)!.startsWith(".")
				&& (
					!classnameWithoutPrefix.startsWith(reference.groupname)
					|| groupnameWithPrefix !== reference.groupnameWithPrefix
				)
			)
		) {
			continue ClassnamesRawLoop
		}

		// Groups classnames with sibling groupnames (eg .from | .via | .to)
		if (mergeList.regex.at(0)!.startsWith(".")) {
			if (mergeList.regex.includes(`.${ groupname }`)) {
				relatedIndices.push(index)
				relatedClassnames.push(classname)
			}

			// No need go further down loop
			continue ClassnamesRawLoop
		}

		// Skip loop if classname has mergeList.exclude
		if (
			mergeList.exclude
	    .filter((current) => !current.endsWith("-"))
	    .some((current) => classname.endsWith(current))
	    || mergeList.exclude
	    .filter((current) => current.endsWith("-"))
	    .some((current) => classname.includes(current))
		) {
			continue ClassnamesRawLoop
		}

		// Skip loop if classname not in mergeList.regex
		if (
			!mergeList.regex
			.filter((current) => !current.endsWith("-"))
			.some((current) => classnameWithoutPrefix.endsWith(current))
			&& !mergeList.regex
			.filter((current) => current.endsWith("-"))
			.some((current) => (
				classnameWithoutPrefix.includes(current)
				&& `-${ classnameWithoutPrefix.split("-").at(0)! }-` !== current
			))
		) {
			continue ClassnamesRawLoop
		}

		relatedIndices.push(index)
		relatedClassnames.push(classname)
	}

	return { relatedIndices, relatedClassnames }
}

// Using wrapper function as wrapper because toSorted(compareFn) uses `groupList` for sorting
function sortClassnamesWrapper (mergeList: MergeList): CompareFunction<string> {
	return function compareFunction (a, b): number {
		const { classnameWithoutPrefix: aClassnameWithoutPrefix } = getClassnameParts(a)
		const { classnameWithoutPrefix: bClassnameWithoutPrefix } = getClassnameParts(b)
		let aIndex = 0
		let bIndex = 0
		let compareResult = 0

		// Sort by mergeList.regex order with `.` (eg .from | .via | .to)
		if (mergeList.regex.at(0)!.startsWith(".")) {
			aIndex = mergeList.regex.map((current) => `.${ aClassnameWithoutPrefix }`.startsWith(current)).indexOf(true)
			bIndex = mergeList.regex.map((current) => `.${ bClassnameWithoutPrefix }`.startsWith(current)).indexOf(true)
			compareResult = normaliseCompareResult(aIndex - bIndex)

			if (compareResult !== 0) {
				return compareResult
			}

			aIndex = 0
			bIndex = 0
		}

		// Sort by mergeList.regex order (`-<regex>-` and `-<regex>`)
		if (!mergeList.regex.at(0)!.startsWith(".")) {
			[aIndex, bIndex] = mergeList.regex.reduce<[number, number]>((accumulator, current, index) => {
				if (!current.endsWith("-")) {
					if (accumulator[0] === -1 && a.endsWith(current)) {
						accumulator[0] = (a.includes(r`\/`)) ? index + 0.5 : index
					}

					if (accumulator[1] === -1 && b.endsWith(current)) {
						accumulator[1] = (b.includes(r`\/`)) ? index + 0.5 : index
					}
				}

				if (current.endsWith("-")) {
					if (accumulator[0] === -1 && a.includes(current)) {
						accumulator[0] = (a.includes(r`\/`)) ? index + 0.5 : index
					}

					if (accumulator[1] === -1 && b.includes(current)) {
						accumulator[1] = (b.includes(r`\/`)) ? index + 0.5 : index
					}
				}

				return accumulator
			}, [-1, -1])

			if (aIndex > -1 || bIndex > -1) {
				compareResult = normaliseCompareResult(aIndex - bIndex)

				if (compareResult !== 0) {
					return compareResult
				}

				aIndex = 0
				bIndex = 0
			}
		}

		// Sort classnames by colour; whole then fraction
		[aIndex, bIndex] = colourList
			.reduce<[number, number]>((accumulator, current, index) => {
				if (accumulator[0] === -1 && a.includes(current)) {
					accumulator[0] = (a.includes(r`\/`)) ? index + 0.5 : index
				}

				if (accumulator[1] === -1 && b.includes(current)) {
					accumulator[1] = (b.includes(r`\/`)) ? index + 0.5 : index
				}

				return accumulator
			}, [-1, -1])

		if (aIndex > -1 || bIndex > -1) {
			compareResult = normaliseCompareResult(aIndex - bIndex)

			if (compareResult !== 0) {
				return compareResult
			}

			aIndex = 0
			bIndex = 0
		}

		// Sort classnames according to size
		if (!mergeList.regex.includes("-base") && !mergeList.regex.includes("-md")) {
			aIndex = sizes.findIndex((current) => a.endsWith(current))
			bIndex = sizes.findIndex((current) => b.endsWith(current))

			if (aIndex !== -1 || bIndex !== -1) {
				compareResult = normaliseCompareResult(aIndex - bIndex)

				if (compareResult !== 0) {
					return compareResult
				}

				aIndex = 0
				bIndex = 0
			}
		}

		/*
		// Sort classnames with % (---included in `const sizes`---)
		const aWithPercentage = a.endsWith(r`\%`)
		const bWithPercentage = b.endsWith(r`\%`)

		if (aWithPercentage || bWithPercentage) {
			compareResult = normaliseCompareResult([aWithPercentage, bWithPercentage])

			if (compareResult !== 0) {
				return compareResult
			}

			aIndex = 0
			bIndex = 0
		}
		*/

		return 0
	}
}

function reorderMoveToTop (orderDataArray: OrderData[], order: Array<Record<"groupname" | "include", string>>): OrderData[] {
	// Reorder and combine same groupnames according to `order` argument
	const groupnamesIndices = order.map<{ group_name: string, indices: number[] }>((currentMap) => ({
		group_name: currentMap.groupname,
		indices: orderDataArray.reduce((accumulator, currentReduce, index) => {
			if (
				currentMap.groupname === currentReduce.group_name
				&& currentReduce.regex.includes(currentMap.include)
			) {
				accumulator.push(index)
			}

			return accumulator
		}, [] as unknown as number[]),
	}))
	const orderedGroupnames: OrderData[] = groupnamesIndices
		.reduce<OrderData[]>((accumulator, current) => {
			const orderData = {
				group_name: current.group_name,
				regex: [...new Set(current.indices.flatMap((currentMap) => orderDataArray.at(currentMap)!.regex))],
			}

			if (orderData.regex.length > 0) {
				accumulator.push(orderData)
			}

			return accumulator
		}, [])

	// Get remaining groupnames
	const orderedIndices = new Set(groupnamesIndices
		.flatMap((current) => current.indices)
		.toSorted((a, b) => a - b))
	const remainingGroupnames = orderDataArray
		.filter((_, index) => !orderedIndices.has(index))

	return [...orderedGroupnames, ...remainingGroupnames]
}

function reorderMoveToGroupname (orderDataArray: OrderData[], order: Array<Record<"groupname" | "include", string>>): OrderData[] {
	// Reorder groupnames
	const groupnamesIndices = order
		.map<number>((currentMap) => (
			orderDataArray.findIndex((currentFindIndex) => (
				currentMap.groupname === currentFindIndex.group_name
				&& currentFindIndex.regex.includes(currentMap.include)
			))
		))
		.toSorted((a, b) => normaliseCompareResult(a - b))
	const groupnamesOrder = order.map((current) => current.groupname)
	const orderedGroupnames: OrderData[] = groupnamesIndices
		.map<OrderData>((current) => orderDataArray.at(current)!)
		.toSorted((a, b) => {
			const aIndex = groupnamesOrder.indexOf(a.group_name)
			const bIndex = groupnamesOrder.indexOf(b.group_name)

			return normaliseCompareResult(aIndex - bIndex)
		})

	// Apply new order
	const targetIndex = Math.min(...groupnamesIndices)
	const newOrderDataArray = orderDataArray
		.map((current, index) => {
			if (index === targetIndex) {
				return orderedGroupnames
			}

			if (groupnamesIndices.includes(index)) {
				return undefined
			}

			return current
		})
		.filter((current) => current !== undefined)
		.flat(Infinity) as OrderData[]

	return newOrderDataArray
}

/*
{
	// Ensure screens are grouped together for breakpoint sorting excluding [2xl, ...]
	const screenList = defaults["screen-size"]
		.map((current) => current.toLowerCase())
		.filter((current): boolean => current.search(/\dxl/g) === -1)
		.map((current): string => `(?:${ current })`)
		.join("|")
	const screenRegex = new RegExp(r`-(?<!\()(${ screenList })(?![a-z]|\))`)

	// Ensure corners are grouped together
	const cornerWordVerticalList = ["top-left", "top-right", "bottom-left", "bottom-right"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const cornerWordVerticalInsetRegex = new RegExp(r`-(?<!\()(${ cornerWordVerticalList })(?![a-z]|\))-`)
	const cornerWordVerticalEndRegex = new RegExp(r`-(?<!\()(${ cornerWordVerticalList })(?![a-z]|\))$`)

	const cornerWordHorizontalList = ["left-bottom", "left-top", "right-bottom", "right-top"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const cornerWordHorizontalInsetRegex = new RegExp(r`-(?<!\()(${ cornerWordHorizontalList })(?![a-z]|\))-`)
	const cornerWordHorizontalEndRegex = new RegExp(r`-(?<!\()(${ cornerWordHorizontalList })(?![a-z]|\))$`)

	const cornerLetterList = ["tl", "tr", "bl", "br"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const cornerLetterInsetRegex = new RegExp(r`-(?<!\()(${ cornerLetterList })(?![a-z]|\))-`)
	const cornerLetterEndRegex = new RegExp(r`-(?<!\()(${ cornerLetterList })(?![a-z]|\))$`)

	const cornerLogicalLetterList = ["ss", "se", "ee", "es"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const cornerLogicalLetterInsetRegex = new RegExp(r`-(?<!\()(${ cornerLogicalLetterList })(?![a-z]|\))-`)
	const cornerLogicalLetterEndRegex = new RegExp(r`-(?<!\()(${ cornerLogicalLetterList })(?![a-z]|\))$`)

	// Ensure `top | right | bottom | left | start | end` are grouped together
	const directionWordList = ["top", "right", "bottom", "left"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const directionWordInsetRegex = new RegExp(r`(?<=[a-z0-9])-(?<!\()(${ directionWordList })(?![a-z]|\))-`)
	const directionWordEndRegex = new RegExp(r`(?<=[a-z0-9])-(?<!\()(${ directionWordList })(?![a-z]|\))$`)

	const directionLetterList = ["t", "r", "b", "l"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const directionLetterInsetRegex = new RegExp(r`-(?<!\()(${ directionLetterList })(?![a-z]|\))-`)
	const directionLetterEndRegex = new RegExp(r`-(?<!\()(${ directionLetterList })(?![a-z]|\))$`)

	const directionLogicalLetterList = ["s", "e"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const directionLogicalLetterInsetRegex = new RegExp(r`-(?<!\()(${ directionLogicalLetterList })(?![a-z]|\))-`)
	const directionLogicalLetterEndRegex = new RegExp(r`-(?<!\()(${ directionLogicalLetterList })(?![a-z]|\))$`)

	// Ensure `row | col` are grouped together
	const rowcolPluralList = ["rows", "cols"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const rowcolPluralInsetRegex = new RegExp(r`-(?<!\()(${ rowcolPluralList })(?![a-z]|\))-`)
	const rowcolPluralEndRegex = new RegExp(r`-(?<!\()(${ rowcolPluralList })(?![a-z]|\))`)

	const rowcolSingularList = ["row", "col"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const rowcolSingularInsetRegex = new RegExp(r`-(?<!\()(${ rowcolSingularList })(?![a-z]|\))-`)
	const rowcolSingularEndRegex = new RegExp(r`-(?<!\()(${ rowcolSingularList })(?![a-z]|\))`)

	// Ensure `start | end` are grouped together
	const startendList = ["start", "end"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const startendInsetRegex = new RegExp(r`-(?<!\()(${ startendList })(?![a-z]|\))-`)
	const startendEndRegex = new RegExp(r`-(?<!\()(${ startendList })(?![a-z]|\))`)

	// Ensure `x | y` are grouped together
	const xyList = ["x", "y"]
	.map((current) => `(?:${ current })`)
	.join("|")
	const xyInsetRegex = new RegExp(r`-(?<!\()(${ xyList })(?![a-z]|\))-`)
	const xyEndRegex = new RegExp(r`-(?<!\()(${ xyList })(?![a-z]|\))$`)

	// Ensure colours are grouped together
	...
	const colourAbsoluteList = defaults["colour-absolute"]
		.map((current) => `(?:${ current.toLowerCase() })`)
		.join("|")
	const colourAbsoluteRegex = new RegExp(r`-(?<!\()(${ colourAbsoluteList })(?![a-z]|\))`)
	const colourRelativeList = defaults["colour-relative"]
		.map((current) => `(?:${ current.toLowerCase() })`)
		.join("|")
	const colourRelativeRegex = new RegExp(r`-(?<!\()(${ colourRelativeList })(?![a-z]|\))`)

	// Ensure fontWeight are grouped together
	const fontWeightList = defaults["font-weight"]
		.map((current) => `(?:${ current.toLowerCase() })`)
		.toSorted(sorting<string>)
		.join("|")
	const fontWeightRegex = new RegExp(r`(?<=font)-(?<!\()(${ fontWeightList })(?![a-z]|\))`)

	// Ensure letterSpacing are grouped together
	const letterSpacingList = defaults["letter-spacing"]
		.map((current) => `(?:${ current.toLowerCase() })`)
		.toSorted(sorting<string>)
		.join("|")
	const letterSpacingRegex = new RegExp(r`(?<=tracking)-(?<!\()(${ letterSpacingList })(?![a-z]|\))`)

	// Ensure lineHeight are grouped together
	const lineHeightList = defaults["line-height"]
		.map((current) => current.toLowerCase())
		.filter((current) => !Number.isInteger(Number(current)))
		.map((current) => `(?:${ current })`)
		.join("|")
	const lineHeightRegex = new RegExp(r`(?<=leading)-(?<!\()(${ lineHeightList })(?![a-z]|\))`)

	// Ensure fontSize and lineHeight shorthand is available
	const fontSizeList = [
		...defaults["font-size"]
			.map((current) => current.toLowerCase())
			.filter((current) => current.search(/^\d+xl/) === -1),
		r`\d{1,4}xl`,
	]
	.map((current) => `(?:${ current })`)
	.join("|")
	const lineHeightListNumber = [
		...defaults["line-height"]
			.map((current) => current.toLowerCase())
			.filter((current) => !Number.isInteger(Number(current))),
		r`\d{1,4}`,
	]
	.map((current) => `(?:${ current })`)
	.join("|")
	const fontSizeShorthandRegex = new RegExp(r`(?<=text)-(?<!\()(${ fontSizeList })(?![a-z]|\))`)
}
/* */

/*
{
	// Ensure more specific classes comes first (with more style properties)
	// Ensure letters comes before numbers
	for (const property of propertyOrder) {
		css[property]!
			.sort((a, b) => {
				const baseA = a
					.replace(/^\.-/, ".")
					// .replaceAll(/ --tw-[^:]+:[^;]+; ?/g, " ")
				const baseB = b
					.replace(/^\.-/, ".")
					// .replaceAll(/ --tw-[^:]+:[^;]+; ?/g, " ")
				const lengthA = baseA.match(/;/g)?.length ?? 0
				const lengthB = baseB.match(/;/g)?.length ?? 0

				if (lengthA !== lengthB) {
					return ((lengthA > lengthB) ? -1 : 1)
				}

				return (sorting<string>(baseA, baseB))
			})
	}

	// Ensure less hyphens comes before more hyphens
	// Ensure letters comes before numbers
	// Ensure classes are sorted alphabetically
	for (const property of propertyOrder) {
		css[property]!
			.sort((a, b) => {
				const baseA = a
					.replace(/^-/, "")
					// .replaceAll(/ --tw-[^:]+:[^;]+; ?/g, " ")
				const baseB = b
					.replace(/^-/, "")
					// .replaceAll(/ --tw-[^:]+:[^;]+; ?/g, " ")
				const wordsA = a.split("-")
				const wordsB = b.split("-")

				if (wordsA.length !== wordsB.length) {
					return ((wordsA.length > wordsB.length) ? 1 : -1)
				}

				if (a.includes("d{1,4}") && !b.includes("d{1,4}")) {
					return (1)
				}

				if (!a.includes("d{1,4}") && b.includes("d{1,4}")) {
					return (-1)
				}

				return (sorting<string>(baseA, baseB))
			})
	}

	// Ensure letters comes before numbers
	// Ensure classes are sorted alphabetically
	css.others
		.sort((a, b) => {
			const baseA = a
				.replace(/^-/, "")
				// .replaceAll(/ --tw-[^:]+:[^;]+; ?/g, " ")
			const baseB = b
				.replace(/^-/, "")
				// .replaceAll(/ --tw-[^:]+:[^;]+; ?/g, " ")
			const lengthA = baseA.match(/;/g)?.length ?? 0
			const lengthB = baseB.match(/;/g)?.length ?? 0

			if (lengthA !== lengthB) {
				return ((lengthA > lengthB) ? -1 : 1)
			}

			if (a.includes("d{1,4}") && !b.includes("d{1,4}")) {
				return (1)
			}

			if (!a.includes("d{1,4}") && b.includes("d{1,4}")) {
				return (-1)
			}

			return (sorting<string>(baseA, baseB))
		})
}
/* */
