// pnpm run transpile && pnpm run generate:order-lists
// :\[.+\]},
// :[]},

import { writeFile } from "node:fs/promises"
import { getArgv } from "./helper.js"
import { generateConcentric } from "./order-concentric.js"
import { generateRecess } from "./order-recess.js"
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
			console.log("target groupName error", mergeData.target, "index:", (data[mergeData.target]?.group_name ?? "-"), "target:", mergeData.groupName)

			continue
		}

		for (const index of mergeData.indexList) {
			if (index === mergeData.target) {
				continue
			}

			if (data[index]?.group_name !== mergeData.groupName) {
				console.log("index error", index, "index:", (data[index]?.group_name ?? "-"), "target:", mergeData.groupName)

				continue
			}

			deleteList.add(index)

			data[mergeData.target]!.regex = (index < mergeData.target)
				? [...data[index].regex, ...data[mergeData.target]!.regex]
				: [...data[mergeData.target]!.regex, ...data[index].regex]
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
			console.log("match error", position, "positionGroupName:", (data[position]?.group_name ?? "-"), "indexGroupName:", indexGroupName)

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
		{ groupName: "@container", target: 0, indexList: [0, 239] },
		{ groupName: "form", target: 4, indexList: [4, 78] },
		{ groupName: "prose", target: 5, indexList: [5, 36, 73, 75, 93] },
		{ groupName: "inset", target: 172, indexList: [172, 177, 182] },
		{ groupName: "inline", target: 19, indexList: [19, 37] },
		{ groupName: "table", target: 23, indexList: [23, 38, 40] },
		{ groupName: "size", target: 28, indexList: [28, 67] },
		{ groupName: "w", target: 29, indexList: [29, 68] },
		{ groupName: "line", target: 39, indexList: [39, 41] },
		{ groupName: "grow", target: 46, indexList: [46, 48] },
		{ groupName: "shrink", target: 49, indexList: [49, 51] },
		{ groupName: "ps", target: 74, indexList: [74, 76] },
		{ groupName: "space", target: 85, indexList: [85, 88, 90] },
		{ groupName: "ms", target: 87, indexList: [87, 89] },
		{ groupName: "mt", target: 92, indexList: [92, 94] },
		{ groupName: "break", target: 125, indexList: [125, 127] },
		{ groupName: "underline", target: 130, indexList: [130, 132] },
		{ groupName: "border", target: 155, indexList: [155, 156, 159, 162, 164, 166, 168, 242, 251] },
		{ groupName: "divide", target: 154, indexList: [154, 157, 158, 163, 165, 167] },
		{ groupName: "ring", target: 170, indexList: [170, 173, 175, 178, 180] },
		{ groupName: "shadow", target: 171, indexList: [171, 174, 176, 179, 181] },
		{ groupName: "blur", target: 188, indexList: [188, 193, 197] },
		{ groupName: "filter", target: 189, indexList: [189, 194] },
		{ groupName: "grayscale", target: 190, indexList: [190, 195] },
		{ groupName: "invert", target: 191, indexList: [191, 200] },
		{ groupName: "sepia", target: 192, indexList: [192, 202] },
		{ groupName: "drop", target: 196, indexList: [196, 203] },
		{ groupName: "skew", target: 209, indexList: [209, 211] },
		{ groupName: "rotate", target: 210, indexList: [210, 213] },
		{ groupName: "transition", target: 218, indexList: [218, 222, 235] },
		{ groupName: "ease", target: 219, indexList: [219, 227] },
		{ groupName: "from", target: 220, indexList: [220, 224, 228, 231] },
		{ groupName: "to", target: 221, indexList: [221, 225, 229, 232] },
		{ groupName: "via", target: 223, indexList: [223, 226, 230, 233] },
		{ groupName: "columns", target: 244, indexList: [244, 252] },
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

	concentric.order = reorderManual(concentric.order, "border", [], "divide", [112])

	concentric.order = merge(concentric.order, [
		{ groupName: "@container", target: 0, indexList: [0, 195] },
		{ groupName: "prose", target: 5, indexList: [5, 15, 96, 98] },
		{ groupName: "flex", target: 38, indexList: [38, 40, 42, 45, 47] },
		{ groupName: "grid", target: 48, indexList: [48, 53] },
		{ groupName: "inline", target: 14, indexList: [14, 18] },
		{ groupName: "table", target: 16, indexList: [16, 20, 22] },
		{ groupName: "list", target: 19, indexList: [19, 163] },
		{ groupName: "line", target: 21, indexList: [21, 23] },
		{ groupName: "inset", target: 129, indexList: [129, 134, 139] },
		{ groupName: "grow", target: 41, indexList: [41, 43] },
		{ groupName: "shrink", target: 44, indexList: [44, 46] },
		{ groupName: "content", target: 56, indexList: [56, 192] },
		{ groupName: "skew", target: 65, indexList: [65, 67] },
		{ groupName: "rotate", target: 66, indexList: [66, 221, 254] },
		{ groupName: "transition", target: 71, indexList: [71, 75, 87] },
		{ groupName: "duration", target: 72, indexList: [72, 83] },
		{ groupName: "from", target: 73, indexList: [73, 77, 80, 84] },
		{ groupName: "to", target: 74, indexList: [74, 78, 81, 85] },
		{ groupName: "via", target: 76, indexList: [76, 79, 82, 86] },
		{ groupName: "mt", target: 95, indexList: [95, 97] },
		{ groupName: "space", target: 103, indexList: [103, 106, 108] },
		{ groupName: "ms", target: 105, indexList: [105, 107] },
		{ groupName: "divide", target: 111, indexList: [111, 114, 116, 118, 121, 123, 125] },
		{ groupName: "border", target: 112, indexList: [112, 113, 115, 117, 120, 122, 124, 126] },
		{ groupName: "ring", target: 127, indexList: [127, 130, 132, 135, 137] },
		{ groupName: "shadow", target: 128, indexList: [128, 131, 133, 136, 138] },
		{ groupName: "size", target: 155, indexList: [155, 157] },
		{ groupName: "w", target: 156, indexList: [156, 158] },
		{ groupName: "text", target: 183, indexList: [183, 185, 189] },
		{ groupName: "underline", target: 177, indexList: [177, 179] },
		{ groupName: "underline", target: 237, indexList: [237, 261] },
		{ groupName: "leading", target: 182, indexList: [182, 184] },
		{ groupName: "break", target: 188, indexList: [188, 202] },
		{ groupName: "accent", target: 196, indexList: [196, 239] },
		{ groupName: "aspect", target: 198, indexList: [198, 245] },
		{ groupName: "backdrop", target: 199, indexList: [199, 240, 246] },
		{ groupName: "blur", target: 200, indexList: [200, 247] },
		{ groupName: "caret", target: 203, indexList: [203, 241] },
		{ groupName: "decoration", target: 204, indexList: [204, 250] },
		{ groupName: "drop", target: 206, indexList: [206, 251] },
		{ groupName: "fill", target: 208, indexList: [208, 242] },
		{ groupName: "grayscale", target: 211, indexList: [211, 243] },
		{ groupName: "invert", target: 213, indexList: [213, 253] },
		{ groupName: "scale", target: 222, indexList: [222, 256] },
		{ groupName: "scroll", target: 224, indexList: [224, 257] },
		{ groupName: "sepia", target: 226, indexList: [226, 258] },
		{ groupName: "stroke", target: 230, indexList: [230, 244, 259] },
		{ groupName: "translate", target: 236, indexList: [236, 238, 260] },
	])

	concentric.order = concentric.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [...new Set(current.regex)],
		}))

	data += `\n"concentric": ${ JSON.stringify(concentric.order, undefined, "\t") },`
	console.log("Concentric - Repeated Properties:\n", getRepeatedProperty(concentric.order))
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
