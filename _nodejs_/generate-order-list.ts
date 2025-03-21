// pnpm run transpile && pnpm run generate:order-lists
// :\[.+\]},
// :[]},

import { writeFile } from "node:fs/promises"
import { getArgv } from "./helper.js"
import { generateConcentric } from "./order-concentric.js"
import { generateRecess } from "./order-recess.js"
import { generateSmacss } from "./order-smacss.js"
import type { OrderData } from "./generator.js"

const source: string = getArgv("--src")
const stylelintrc: string = getArgv("--stylelintrc")
const out: string = getArgv("--out")

interface MergeData {
	groupName: string,
	target: number,
	indexList: number[],
}

function getRepeatedProperty (data: OrderData[]): MergeData[] {
	const repeatedGroupNameCount: Record<string, number[]> = data
		.map((current: OrderData) => current.group_name)
		.reduce((accumulator: Record<string, number[]>, current: string, index: number) => {
			accumulator[current] = (Object.hasOwn(accumulator, current))
				? [...(accumulator[current]!), index]
				: [index]

			return accumulator
		}, {})

	const list: MergeData[] = Object.entries(repeatedGroupNameCount)
		.filter((current: [string, number[]]) => current[1].length > 1)
		.reduce((accumulator: MergeData[], current: [string, number[]]) => {
			accumulator.push({ groupName: current[0], target: 0, indexList: current[1] })

			return accumulator
		}, [])

	return list
}

function merge (data: OrderData[], mergeDataList: MergeData[]): OrderData[] {
	const deleteList = new Set<number>()

	for (const mergeData of mergeDataList) {
		if ((data[mergeData.target]?.group_name ?? "-") !== mergeData.groupName) {
			console.log("match error", (data[mergeData.target]?.group_name ?? "-"), mergeData.groupName)

			continue
		}

		for (const index of mergeData.indexList) {
			if (index === mergeData.target) {
				continue
			}

			deleteList.add(index)

			data[mergeData.target]!.regex = (index < mergeData.target)
				? [...data[index]!.regex, ...data[mergeData.target]!.regex]
				: [...data[mergeData.target]!.regex, ...data[index]!.regex]
		}
	}

	for (const index of [...deleteList].toSorted((a, b) => b - a)) {
		data = [...(data.slice(0, index) ?? []), ...(data.slice(index + 1) ?? [])]
	}

	return data
}

function reorderStyles (data: OrderData[], order: string[]): OrderData[] {
	const indexList: number[] = order
		.map((current: string): number => data.findIndex((current_: OrderData): boolean => current === current_.group_name))

	const groupsArray: OrderData[] = indexList
		.reduce((accumulator: OrderData[], current: number): OrderData[] => [...accumulator, data[current]!], [])

	for (const index of indexList.toSorted((a, b) => a - b).toReversed()) {
		data = [...(data.slice(0, index) ?? []), ...(data.slice(index + 1) ?? [])]
	}

	return [...groupsArray, ...data]
}

function reorderManual (data: OrderData[], groupNameTarget: string, indexTarget: number[], indexGroupName: string, indexList: number[]): OrderData[] {
	indexList = indexList.toSorted((a, b) => a - b).toReversed()

	for (const [index, position] of indexList.entries()) {
		if (data[position]?.group_name !== indexGroupName) {
			console.log("match error", (data[position]?.group_name ?? "-"), indexGroupName)

			continue
		}

		const targetIndex = indexTarget[index] ?? position - 1

		if (data[targetIndex]?.group_name === groupNameTarget) {
			const target = data[targetIndex]

			data = [...data.slice(0, targetIndex), ...data.slice(position, position + 1), target, ...data.slice(position + 1)]
		}
	}

	return data
}

await (async function () {
	const positionStyleOrder = ["static", "absolute", "relative", "fixed", "sticky"]
	const positionXYOrder = ["inset", "top", "right", "bottom", "left", "z"]
	const displayStyleOrder = ["hidden", "inline", "block", "flex", "grid", "table", "contents", "flow", "list"]
	const sizeStyleOrder = ["container", "size", "w", "h"]

	const referenceClasses = [
		{ group_name: "dark", regex: ["dark"] },
		{ group_name: "group", regex: ["group", String.raw`group/[\dA-Za-z]{1,}`] },
		{ group_name: "peer", regex: ["peer", String.raw`peer/[\dA-Za-z]{1,}`] },
	]
	const proseClasses = [
		{ group_name: "prose", regex: ["prose", "prose-invert", "not-prose"] },
	]
	// Added back in from prepare-css
	const containerClasses = [
		{ group_name: "@container", regex: ["@container", "@container-normal", String.raw`@container/[\dA-Za-z]{1,}`] },
	]
	let data = ""

	/* */
	// Recess Order
	const recess = await generateRecess(source, stylelintrc)

	recess.order = [...referenceClasses, ...containerClasses, ...proseClasses, ...recess.order]

	recess.order = reorderStyles(recess.order, [
		"@container",
		"dark",
		"group",
		"peer",
		"form",
		"prose",
		"sr",
		...positionStyleOrder,
		...positionXYOrder,
		...displayStyleOrder,
		...sizeStyleOrder,
	])

	recess.order = reorderManual(recess.order, "border", [], "divide", [155, 159])

	recess.order = merge(recess.order, [
		{ groupName: "@container", target: 0, indexList: [0, 232] },
		{ groupName: "form", target: 4, indexList: [4, 78] },
		{ groupName: "prose", target: 5, indexList: [5, 36, 73, 75, 93] },
		{ groupName: "inset", target: 170, indexList: [170, 173, 178] },
		{ groupName: "inline", target: 19, indexList: [19, 37] },
		// { groupName: "flex", target: 0, indexList: [] },
		// { groupName: "grid", target: 0, indexList: [] },
		{ groupName: "table", target: 23, indexList: [23, 38, 40] },
		// { groupName: "list", target: 0, indexList: [] },
		{ groupName: "size", target: 28, indexList: [28, 67] },
		{ groupName: "w", target: 29, indexList: [29, 68] },
		// { groupName: "box", target: 0, indexList: [] },
		{ groupName: "line", target: 39, indexList: [39, 41] },
		{ groupName: "grow", target: 46, indexList: [46, 48] },
		{ groupName: "shrink", target: 49, indexList: [49, 51] },
		// { groupName: "content", target: 0, indexList: [] },
		{ groupName: "ps", target: 74, indexList: [74, 76] },
		{ groupName: "space", target: 85, indexList: [85, 88, 90] },
		{ groupName: "ms", target: 87, indexList: [87, 89] },
		{ groupName: "mt", target: 92, indexList: [92, 94] },
		// { groupName: "text", target: 0, indexList: [] },
		// { groupName: "font", target: 0, indexList: [] },
		// { groupName: "normal", target: 0, indexList: [] },
		{ groupName: "break", target: 125, indexList: [125, 127] },
		{ groupName: "underline", target: 130, indexList: [130, 132] },
		{ groupName: "border", target: 155, indexList: [155, 156, 160, 162, 164, 166, 235, 244] },
		// { groupName: "scroll", target: 0, indexList: [] },
		// { groupName: "bg", target: 0, indexList: [] },
		{ groupName: "divide", target: 154, indexList: [154, 157, 161, 163, 165] },
		{ groupName: "ring", target: 168, indexList: [168, 171, 174, 176] },
		{ groupName: "shadow", target: 169, indexList: [169, 172, 175, 177] },
		{ groupName: "blur", target: 184, indexList: [184, 189, 193] },
		{ groupName: "filter", target: 185, indexList: [185, 190] },
		{ groupName: "grayscale", target: 186, indexList: [186, 191] },
		{ groupName: "invert", target: 187, indexList: [187, 196] },
		{ groupName: "sepia", target: 188, indexList: [188, 198] },
		{ groupName: "drop", target: 192, indexList: [192, 199] },
		{ groupName: "transform", target: 242, indexList: [242, 246] },
		{ groupName: "skew", target: 205, indexList: [205, 207] },
		{ groupName: "rotate", target: 206, indexList: [206, 209] },
		{ groupName: "transition", target: 214, indexList: [214, 218, 228] },
		{ groupName: "ease", target: 215, indexList: [215, 220] },
		{ groupName: "from", target: 216, indexList: [216, 221, 224] },
		{ groupName: "to", target: 217, indexList: [217, 222, 225] },
		{ groupName: "via", target: 219, indexList: [219, 223, 226] },
		{ groupName: "columns", target: 237, indexList: [237, 245] },
	])

	recess.order = recess.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [...new Set(current.regex)],
		}))

	data += `\n"recess": ${ JSON.stringify(recess.order, undefined, "\t") },`
	console.log("Recess - Repeated Properties:\n", getRepeatedProperty(recess.order))
	/* */

	/* */
	// Concentric Order
	const concentric = await generateConcentric(source, stylelintrc)

	concentric.order = [...referenceClasses, ...containerClasses, ...proseClasses, ...concentric.order]

	concentric.order = reorderStyles(concentric.order, [
		"@container",
		"dark",
		"group",
		"peer",
		"form",
		"prose",
		"sr",
	])

	concentric.order = reorderManual(concentric.order, "border", [], "divide", [109])

	concentric.order = merge(concentric.order, [
		{ groupName: "@container", target: 0, indexList: [0, 188] },
		{ groupName: "prose", target: 5, indexList: [5, 15, 93, 95] },
		// { groupName: "box", target: 0, indexList: [] },
		{ groupName: "flex", target: 38, indexList: [38, 40, 42, 45, 47] },
		{ groupName: "grid", target: 48, indexList: [48, 53] },
		{ groupName: "inline", target: 14, indexList: [14, 18] },
		{ groupName: "table", target: 16, indexList: [16, 20, 22] },
		{ groupName: "list", target: 19, indexList: [19, 156] },
		{ groupName: "line", target: 21, indexList: [21, 23] },
		{ groupName: "inset", target: 124, indexList: [124, 127, 132] },
		{ groupName: "grow", target: 41, indexList: [41, 43] },
		{ groupName: "shrink", target: 44, indexList: [44, 46] },
		{ groupName: "content", target: 56, indexList: [56, 185] },
		// { groupName: "transform", target: 0, indexList: [] },
		{ groupName: "skew", target: 65, indexList: [65, 67] },
		{ groupName: "rotate", target: 66, indexList: [66, 214, 247] },
		{ groupName: "transition", target: 71, indexList: [71, 75, 84] },
		{ groupName: "duration", target: 72, indexList: [72, 80] },
		{ groupName: "from", target: 73, indexList: [73, 77, 81] },
		{ groupName: "to", target: 74, indexList: [74, 78, 82] },
		{ groupName: "via", target: 76, indexList: [76, 79, 83] },
		{ groupName: "mt", target: 92, indexList: [92, 94] },
		{ groupName: "space", target: 100, indexList: [100, 103, 105] },
		{ groupName: "ms", target: 102, indexList: [102, 104] },
		{ groupName: "divide", target: 108, indexList: [108, 111, 113, 115, 118, 120] },
		{ groupName: "border", target: 109, indexList: [109, 110, 112, 114, 117, 119, 121] },
		{ groupName: "ring", target: 122, indexList: [122, 125, 128, 130] },
		{ groupName: "shadow", target: 123, indexList: [123, 126, 129, 131] },
		{ groupName: "size", target: 148, indexList: [148, 150] },
		{ groupName: "w", target: 149, indexList: [149, 151] },
		{ groupName: "text", target: 176, indexList: [176, 178, 182] },
		// { groupName: "normal", target: 0, indexList: [] },
		{ groupName: "decoration", target: 197, indexList: [197, 243] },
		{ groupName: "underline", target: 170, indexList: [170, 172] },
		{ groupName: "underline", target: 230, indexList: [230, 254] },
		{ groupName: "leading", target: 175, indexList: [175, 177] },
		{ groupName: "break", target: 181, indexList: [181, 195] },
		{ groupName: "accent", target: 189, indexList: [189, 232] },
		{ groupName: "aspect", target: 191, indexList: [191, 238] },
		{ groupName: "backdrop", target: 192, indexList: [192, 233, 239] },
		{ groupName: "blur", target: 193, indexList: [193, 240] },
		{ groupName: "caret", target: 196, indexList: [196, 234] },
		{ groupName: "drop", target: 199, indexList: [199, 244] },
		{ groupName: "fill", target: 201, indexList: [201, 235] },
		{ groupName: "grayscale", target: 204, indexList: [204, 236] },
		{ groupName: "invert", target: 206, indexList: [206, 246] },
		{ groupName: "scale", target: 215, indexList: [215, 249] },
		{ groupName: "scroll", target: 217, indexList: [217, 250] },
		{ groupName: "sepia", target: 219, indexList: [219, 251] },
		{ groupName: "stroke", target: 223, indexList: [223, 237, 252] },
		{ groupName: "translate", target: 229, indexList: [229, 231, 253] },
	])

	concentric.order = concentric.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [...new Set(current.regex)],
		}))

	data += `\n"concentric": ${ JSON.stringify(concentric.order, undefined, "\t") },`
	console.log("Concentric - Repeated Properties:\n", getRepeatedProperty(concentric.order))
	/* */

	/* */
	// Smacss Order
	const smacss = await generateSmacss(source, stylelintrc)

	smacss.order = [...referenceClasses, ...containerClasses, ...proseClasses, ...smacss.order]

	smacss.order = reorderStyles(smacss.order, [
		"@container",
		"dark",
		"group",
		"peer",
		"form",
		"prose",
		"sr",
	])

	smacss.order = reorderManual(smacss.order, "border", [102], "divide", [128])

	smacss.order = merge(smacss.order, [
		{ groupName: "@container", target: 0, indexList: [0, 164] },
		{ groupName: "form", target: 4, indexList: [4, 85] },
		{ groupName: "prose", target: 5, indexList: [5, 7, 70, 72] },
		{ groupName: "content", target: 8, indexList: [8, 57] },
		{ groupName: "flex", target: 47, indexList: [47, 49, 51, 54, 56] },
		{ groupName: "grid", target: 42, indexList: [42, 46] },
		{ groupName: "inline", target: 14, indexList: [14, 17] },
		{ groupName: "table", target: 15, indexList: [15, 19, 21] },
		{ groupName: "line", target: 20, indexList: [20, 22] },
		{ groupName: "inset", target: 32, indexList: [32, 37] },
		{ groupName: "inset", target: 124, indexList: [124, 127, 132] },
		// { groupName: "box", target: 0, indexList: [] },
		{ groupName: "grow", target: 50, indexList: [50, 52] },
		{ groupName: "shrink", target: 53, indexList: [53, 55] },
		{ groupName: "justify", target: 60, indexList: [60, 185] },
		{ groupName: "size", target: 63, indexList: [63, 65] },
		{ groupName: "w", target: 64, indexList: [64, 66] },
		{ groupName: "mt", target: 69, indexList: [69, 71] },
		{ groupName: "space", target: 77, indexList: [77, 80, 82] },
		{ groupName: "ms", target: 79, indexList: [79, 81] },
		{ groupName: "gap", target: 99, indexList: [99, 222] },
		{ groupName: "divide", target: 102, indexList: [102, 105, 107, 109, 111, 114, 116] },
		{ groupName: "border", target: 104, indexList: [104, 106, 108, 110, 113, 115, 117] },
		// { groupName: "bg", target: 0, indexList: [] },
		{ groupName: "ring", target: 122, indexList: [122, 125, 128, 130] },
		{ groupName: "shadow", target: 123, indexList: [123, 126, 129, 131] },
		{ groupName: "text", target: 134, indexList: [134, 136] },
		// { groupName: "font", target: 0, indexList: [] },
		{ groupName: "decoration", target: 175, indexList: [175, 220] },
		{ groupName: "underline", target: 145, indexList: [145, 147] },
		{ groupName: "underline", target: 208, indexList: [208, 231] },
		{ groupName: "normal", target: 154, indexList: [154, 188] },
		{ groupName: "break", target: 156, indexList: [156, 173] },
		{ groupName: "accent", target: 165, indexList: [165, 211] },
		{ groupName: "aspect", target: 168, indexList: [168, 215] },
		{ groupName: "backdrop", target: 169, indexList: [169, 212, 216] },
		{ groupName: "blur", target: 171, indexList: [171, 217] },
		{ groupName: "caret", target: 174, indexList: [174, 213] },
		{ groupName: "drop", target: 177, indexList: [177, 221] },
		{ groupName: "grayscale", target: 181, indexList: [181, 214] },
		{ groupName: "invert", target: 182, indexList: [182, 224] },
		{ groupName: "rotate", target: 195, indexList: [195, 225] },
		{ groupName: "scale", target: 196, indexList: [196, 227] },
		{ groupName: "scroll", target: 198, indexList: [198, 228] },
		{ groupName: "sepia", target: 199, indexList: [199, 229] },
		{ groupName: "translate", target: 207, indexList: [207, 210, 230] },
	])

	smacss.order = smacss.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [...new Set(current.regex)],
		}))

	data += `\n"smacss": ${ JSON.stringify(smacss.order, undefined, "\t") },`
	console.log("Smacss - Repeated Properties:\n", getRepeatedProperty(smacss.order))
	/* */

	data = `{${ data.slice(0, -1) }\n}`
		.replaceAll('\n\t\t\t"', ' "')
		.replaceAll("\n\t\t]", "]")
		.replaceAll('\n\t\t"', ' "')
		.replaceAll("\n\t}", "}")
		.replaceAll("\n\t{ ", "\n\t{")
		.replaceAll('"group_name": "', '"group_name":"')
		.replaceAll('", "regex": [ ', '","regex":[')

	await writeFile(out, data, { encoding: "utf8", flag: "w" })
})()
