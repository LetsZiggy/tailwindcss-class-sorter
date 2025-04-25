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

	recess.order = reorderManual(recess.order, "border", [], "divide", [157, 163])

	recess.order = merge(recess.order, [
		{ groupName: "@container", target: 0, indexList: [0, 98] },
		{ groupName: "form", target: 4, indexList: [4, 78] },
		{ groupName: "prose", target: 5, indexList: [5, 36, 73, 75, 93] },
		{ groupName: "inset", target: 174, indexList: [174, 177, 182, 198, 208] },
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
		{ groupName: "text", target: 104, indexList: [104, 118] },
		{ groupName: "text", target: 136, indexList: [136, 202, 210] },
		{ groupName: "break", target: 126, indexList: [126, 260] },
		{ groupName: "underline", target: 131, indexList: [131, 133] },
		{ groupName: "border", target: 157, indexList: [157, 158, 160, 164, 166, 168, 170, 194, 206, 263, 273] },
		{ groupName: "divide", target: 156, indexList: [156, 159, 161, 165, 167, 169] },
		{ groupName: "ring", target: 172, indexList: [172, 175, 178, 180, 189, 199] },
		{ groupName: "shadow", target: 173, indexList: [173, 176, 179, 181, 190, 200] },
		{ groupName: "fill", target: 187, indexList: [187, 196, 231] },
		{ groupName: "from", target: 188, indexList: [188, 197, 245, 250, 253] },
		{ groupName: "stroke", target: 191, indexList: [191, 201, 232] },
		{ groupName: "to", target: 192, indexList: [192, 203, 246, 251, 254] },
		{ groupName: "via", target: 193, indexList: [193, 204, 248, 252, 255] },
		{ groupName: "drop", target: 195, indexList: [195, 207, 220, 227] },
		{ groupName: "mask", target: 209, indexList: [209, 211, 230, 268] },
		{ groupName: "blur", target: 212, indexList: [212, 217, 221] },
		{ groupName: "filter", target: 213, indexList: [213, 218] },
		{ groupName: "grayscale", target: 214, indexList: [214, 219] },
		{ groupName: "invert", target: 215, indexList: [215, 224] },
		{ groupName: "sepia", target: 216, indexList: [216, 226] },
		{ groupName: "skew", target: 234, indexList: [234, 236] },
		{ groupName: "rotate", target: 235, indexList: [235, 238] },
		{ groupName: "transition", target: 243, indexList: [243, 247, 257] },
		{ groupName: "ease", target: 244, indexList: [244, 249] },
		{ groupName: "columns", target: 265, indexList: [265, 274] },
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

	concentric.order = reorderManual(concentric.order, "border", [91], "divide", [94])

	concentric.order = merge(concentric.order, [
		{ groupName: "@container", target: 0, indexList: [0, 224] },
		{ groupName: "prose", target: 5, indexList: [5, 15, 129, 131] },
		{ groupName: "inline", target: 14, indexList: [14, 18] },
		{ groupName: "table", target: 16, indexList: [16, 20, 22] },
		{ groupName: "line", target: 21, indexList: [21, 23] },
		{ groupName: "inset", target: 111, indexList: [111, 122, 160, 163, 168] },
		{ groupName: "grow", target: 41, indexList: [41, 43] },
		{ groupName: "shrink", target: 44, indexList: [44, 46] },
		{ groupName: "skew", target: 65, indexList: [65, 67] },
		{ groupName: "rotate", target: 66, indexList: [66, 251, 288] },
		{ groupName: "transition", target: 71, indexList: [71, 75, 84] },
		{ groupName: "duration", target: 72, indexList: [72, 80] },
		{ groupName: "from", target: 73, indexList: [73, 77, 81, 94, 110] },
		{ groupName: "to", target: 74, indexList: [74, 78, 82, 100, 117] },
		{ groupName: "via", target: 76, indexList: [76, 79, 83, 101, 118] },
		{ groupName: "accent", target: 89, indexList: [89, 102, 225, 270] },
		{ groupName: "bg", target: 90, indexList: [90, 103, 172] },
		{ groupName: "divide", target: 91, indexList: [91, 107, 145, 147, 149, 151, 154, 156] },
		{ groupName: "border", target: 92, indexList: [92, 104, 120, 144, 146, 148, 150, 153, 155, 157, 195] },
		{ groupName: "fill", target: 93, indexList: [93, 109, 237, 274] },
		{ groupName: "outline", target: 95, indexList: [95, 112, 143] },
		{ groupName: "ring", target: 96, indexList: [96, 113, 158, 161, 164, 166] },
		{ groupName: "shadow", target: 97, indexList: [97, 114, 159, 162, 165, 167] },
		{ groupName: "stroke", target: 98, indexList: [98, 115, 260, 277, 293] },
		{ groupName: "text", target: 99, indexList: [99, 116, 124, 198, 210, 218] },
		{ groupName: "text", target: 212, indexList: [212, 214] },
		{ groupName: "caret", target: 105, indexList: [105, 232, 272] },
		{ groupName: "decoration", target: 106, indexList: [106, 204] },
		{ groupName: "decoration", target: 233, indexList: [233, 283] },
		{ groupName: "drop", target: 108, indexList: [108, 121, 235, 273, 284] },
		{ groupName: "mask", target: 123, indexList: [123, 125, 244, 276, 287] },
		{ groupName: "mt", target: 128, indexList: [128, 130] },
		{ groupName: "space", target: 136, indexList: [136, 139, 141] },
		{ groupName: "ms", target: 138, indexList: [138, 140] },
		{ groupName: "size", target: 184, indexList: [184, 186] },
		{ groupName: "w", target: 185, indexList: [185, 187] },
		{ groupName: "underline", target: 206, indexList: [206, 208] },
		{ groupName: "underline", target: 267, indexList: [267, 295] },
		{ groupName: "leading", target: 211, indexList: [211, 213] },
		{ groupName: "break", target: 217, indexList: [217, 231] },
		{ groupName: "aspect", target: 227, indexList: [227, 278] },
		{ groupName: "backdrop", target: 228, indexList: [228, 271, 279] },
		{ groupName: "blur", target: 229, indexList: [229, 280] },
		{ groupName: "grayscale", target: 240, indexList: [240, 275] },
		{ groupName: "invert", target: 242, indexList: [242, 286] },
		{ groupName: "scale", target: 252, indexList: [252, 290] },
		{ groupName: "scroll", target: 254, indexList: [254, 291] },
		{ groupName: "sepia", target: 256, indexList: [256, 292] },
		{ groupName: "translate", target: 266, indexList: [266, 269, 294] },
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
