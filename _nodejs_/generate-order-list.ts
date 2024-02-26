import { writeFile } from "node:fs/promises"
import { getArgv } from "./helper.js"
import { generateConcentric } from "./order-concentric.js"
import { generateRecess } from "./order-recess.js"
import { generateSmacss } from "./order-smacss.js"
import type { OrderData } from "./generator.js"

const source: string = getArgv("--src")
const stylelintrc: string = getArgv("--stylelintrc")
const out: string = getArgv("--out")

interface JoinUpArraysOptions {
	end?: number,
	excludes?: number[],
	mergeTo?: number,
}

interface JoinDownArraysOptions {
	start?: number,
	excludes?: number[],
	mergeTo?: number,
}

function getRepeatedProperty (data: OrderData[]): Array<[string, number]> {
	const repeatedGroupNameCount: Record<string, number> = data
		.map((current: OrderData) => current.group_name)
		.reduce((accumulator: Record<string, number>, current: string) => {
			accumulator[current] = (Object.hasOwn(accumulator, current))
				? accumulator[current]! + 1
				: 1

			return accumulator
		}, {})

	const list: Array<[string, number]> = Object.entries(repeatedGroupNameCount)
		.filter((current: [string, number]) => current[1] > 1)

	return list
}

function joinUpArrays (data: OrderData[], propertyName: string, { end = 999, excludes = [], mergeTo = 0 }: JoinUpArraysOptions = {}) {
	const indexList: number[] = data
		.map((current: OrderData) => current.group_name)
		.reduce((accumulator: number[], current: string, index: number) => {
			if (current === propertyName) {
				accumulator.push(index)
			}

			return accumulator
		}, [])
		.filter((_, index: number) => (index >= mergeTo) && (index < end) && !excludes.includes(index))

	const groupMerged: OrderData = indexList
		.map((current: number): OrderData => data[current]!)
		.reduce((accumulator: OrderData, current: OrderData): OrderData => {
			if (accumulator.group_name === "") {
				accumulator.group_name = current?.group_name ?? ""
			}

			accumulator.regex = [...accumulator.regex, ...current.regex]

			return accumulator
		}, { group_name: "", regex: [] })

	// Remove later items first
	for (const index of indexList.toSorted((a, b) => b - a)) {
		data.splice(index, 1)
	}

	// Add group at first index
	data.splice(indexList.toSorted((a: number, b: number) => a - b).at(0)!, 0, groupMerged)

	return data
}

function joinDownArrays (data: OrderData[], propertyName: string, { excludes = [], mergeTo = 999, start = -1 }: JoinDownArraysOptions = {}) {
	const indexList: number[] = data
		.map((current: OrderData) => current.group_name)
		.reduce((accumulator: number[], current: string, index: number) => {
			if (current === propertyName) {
				accumulator.push(index)
			}

			return accumulator
		}, [])
		.filter((_, index: number) => (index <= mergeTo) && (index > start) && !excludes.includes(index))

	const groupMerged: OrderData = indexList
		.map((current: number): OrderData => data[current]!)
		.reduce((accumulator: OrderData, current: OrderData) => {
			if (accumulator.group_name === "") {
				accumulator.group_name = current?.group_name ?? ""
			}

			accumulator.regex = [...accumulator.regex, ...current.regex]

			return accumulator
		}, { group_name: "", regex: [] })

	// Add group at last index + 1
	data.splice(indexList.toSorted((a: number, b: number) => a - b).at(-1)! + 1, 0, groupMerged)

	// Remove later items first
	for (const index of indexList.toSorted((a, b) => b - a)) {
		data.splice(index, 1)
	}

	return data
}

function reorderStyles (data: OrderData[], order: string[]): OrderData[] {
	const indexList: number[] = order
		.map((current: string): number => data.findIndex((current_: OrderData): boolean => current === current_.group_name))

	const groupsArray: OrderData[] = indexList
		.reduce((accumulator: OrderData[], current: number): OrderData[] => [...accumulator, data[current]!], [])

	if (order.length === 1) {
		data.splice(indexList.at(0)!, 1)
		data.splice(0, 0, ...groupsArray)

		return data
	}

	// Remove later items first
	for (const index of indexList.toSorted((a, b) => b - a)) {
		data.splice(index, 1)
	}

	data.splice(indexList.toSorted((a: number, b: number): number => a - b).at(0)!, 0, ...groupsArray)

	return data
}

await (async function () {
	const positionStyleOrder = ["static", "absolute", "relative", "fixed", "sticky"]
	const displayStyleOrder = ["hidden", "inline", "block", "flex", "grid", "table", "contents", "flow", "list"]
	const sizeStyleOrder = ["container", "w", "h"]

	const referenceClasses = [
		{ group_name: "dark", regex: ["dark"] },
		{ group_name: "group", regex: ["group", String.raw`group/[\dA-Za-z]{1,}`] },
		{ group_name: "peer", regex: ["peer", String.raw`peer/[\dA-Za-z]{1,}`] },
	]
	const proseClasses = [
		{ group_name: "prose", regex: ["prose", "prose-invert", "not-prose"] },
	]
	const containerClasses = [
		{ group_name: "@container", regex: ["@container", "@container-normal", String.raw`@container/[\dA-Za-z]{1,}`] },
	]
	let data = ""

	/* */
	// Recess Order
	const recess = await generateRecess(source, stylelintrc)

	recess.order = [...referenceClasses, ...containerClasses, ...proseClasses, ...recess.order]

	recess.order = joinUpArrays(recess.order, "@container")
	recess.order = joinUpArrays(recess.order, "form")
	recess.order = joinUpArrays(recess.order, "prose")
	recess.order = joinUpArrays(recess.order, "inline")
	recess.order = joinUpArrays(recess.order, "flex")
	recess.order = joinUpArrays(recess.order, "grid")
	recess.order = joinUpArrays(recess.order, "table", { end: 2 }) // excludes `Table Layout`
	recess.order = joinUpArrays(recess.order, "p")
	recess.order = joinUpArrays(recess.order, "px")
	recess.order = joinUpArrays(recess.order, "py")
	recess.order = joinUpArrays(recess.order, "ps")
	recess.order = joinUpArrays(recess.order, "pe")
	recess.order = joinUpArrays(recess.order, "pt")
	recess.order = joinUpArrays(recess.order, "pr")
	recess.order = joinUpArrays(recess.order, "pb")
	recess.order = joinUpArrays(recess.order, "pl")
	recess.order = joinUpArrays(recess.order, "m")
	recess.order = joinUpArrays(recess.order, "mx")
	recess.order = joinUpArrays(recess.order, "my")
	recess.order = joinUpArrays(recess.order, "ms")
	recess.order = joinUpArrays(recess.order, "me")
	recess.order = joinUpArrays(recess.order, "mt")
	recess.order = joinUpArrays(recess.order, "mr")
	recess.order = joinUpArrays(recess.order, "mb")
	recess.order = joinUpArrays(recess.order, "ml")
	recess.order = joinUpArrays(recess.order, "space")
	recess.order = joinUpArrays(recess.order, "bg")
	recess.order = joinUpArrays(recess.order, "text", { end: 2 }) // excludes `Text Overflow`
	recess.order = joinUpArrays(recess.order, "placeholder")
	recess.order = joinUpArrays(recess.order, "border", { mergeTo: 1 }) // excludes `Border Collapse` | `Border Spacing`
	recess.order = joinUpArrays(recess.order, "rounded")
	recess.order = joinUpArrays(recess.order, "blur")
	recess.order = joinUpArrays(recess.order, "filter")
	recess.order = joinUpArrays(recess.order, "grayscale")
	recess.order = joinUpArrays(recess.order, "invert")
	recess.order = joinUpArrays(recess.order, "sepia")
	recess.order = joinUpArrays(recess.order, "drop")
	recess.order = joinUpArrays(recess.order, "ring")
	recess.order = joinUpArrays(recess.order, "shadow")
	recess.order = joinUpArrays(recess.order, "accent")
	recess.order = joinUpArrays(recess.order, "backdrop")
	recess.order = joinUpArrays(recess.order, "caret")
	recess.order = joinUpArrays(recess.order, "columns")
	recess.order = joinUpArrays(recess.order, "scroll")
	recess.order = joinUpArrays(recess.order, "from")
	recess.order = joinUpArrays(recess.order, "to")
	recess.order = joinUpArrays(recess.order, "via")
	recess.order = joinDownArrays(recess.order, "aspect")

	recess.order = reorderStyles(recess.order, positionStyleOrder)
	recess.order = reorderStyles(recess.order, displayStyleOrder)
	recess.order = reorderStyles(recess.order, sizeStyleOrder)
	recess.order = reorderStyles(recess.order, ["sr"])
	recess.order = reorderStyles(recess.order, ["prose"])
	recess.order = reorderStyles(recess.order, ["form"])
	recess.order = reorderStyles(recess.order, ["peer"])
	recess.order = reorderStyles(recess.order, ["group"])
	recess.order = reorderStyles(recess.order, ["dark"])
	recess.order = reorderStyles(recess.order, ["@container"])
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

	concentric.order = joinUpArrays(concentric.order, "@container")
	concentric.order = joinUpArrays(concentric.order, "form")
	concentric.order = joinUpArrays(concentric.order, "prose")
	concentric.order = joinUpArrays(concentric.order, "inline")
	concentric.order = joinUpArrays(concentric.order, "flex")
	concentric.order = joinUpArrays(concentric.order, "grid")
	concentric.order = joinUpArrays(concentric.order, "table", { end: 2 }) // excludes `Table Layout`
	concentric.order = joinUpArrays(concentric.order, "p")
	concentric.order = joinUpArrays(concentric.order, "px")
	concentric.order = joinUpArrays(concentric.order, "py")
	concentric.order = joinUpArrays(concentric.order, "ps")
	concentric.order = joinUpArrays(concentric.order, "pe")
	concentric.order = joinUpArrays(concentric.order, "pt")
	concentric.order = joinUpArrays(concentric.order, "pr")
	concentric.order = joinUpArrays(concentric.order, "pb")
	concentric.order = joinUpArrays(concentric.order, "pl")
	concentric.order = joinUpArrays(concentric.order, "m")
	concentric.order = joinUpArrays(concentric.order, "mx")
	concentric.order = joinUpArrays(concentric.order, "my")
	concentric.order = joinUpArrays(concentric.order, "ms")
	concentric.order = joinUpArrays(concentric.order, "me")
	concentric.order = joinUpArrays(concentric.order, "mt")
	concentric.order = joinUpArrays(concentric.order, "mr")
	concentric.order = joinUpArrays(concentric.order, "mb")
	concentric.order = joinUpArrays(concentric.order, "ml")
	concentric.order = joinUpArrays(concentric.order, "space")
	concentric.order = joinUpArrays(concentric.order, "bg")
	concentric.order = joinUpArrays(concentric.order, "text", { excludes: [3] }) // excludes `Text Wrap`
	concentric.order = joinUpArrays(concentric.order, "break")
	concentric.order = joinUpArrays(concentric.order, "decoration")
	concentric.order = joinUpArrays(concentric.order, "underline")
	concentric.order = joinUpArrays(concentric.order, "placeholder")
	// concentric.order = joinArrays(concentric.order, "border")// excludes `Border Collapse` | `Border Spacing` - NOT NEEDED
	concentric.order = joinUpArrays(concentric.order, "rounded")
	concentric.order = joinUpArrays(concentric.order, "fill")
	concentric.order = joinUpArrays(concentric.order, "stroke")
	concentric.order = joinUpArrays(concentric.order, "blur")
	concentric.order = joinUpArrays(concentric.order, "filter")
	concentric.order = joinUpArrays(concentric.order, "grayscale")
	concentric.order = joinUpArrays(concentric.order, "invert")
	concentric.order = joinUpArrays(concentric.order, "sepia")
	concentric.order = joinUpArrays(concentric.order, "drop")
	concentric.order = joinUpArrays(concentric.order, "ring")
	concentric.order = joinUpArrays(concentric.order, "shadow")
	concentric.order = joinUpArrays(concentric.order, "accent")
	concentric.order = joinUpArrays(concentric.order, "backdrop")
	concentric.order = joinUpArrays(concentric.order, "caret")
	concentric.order = joinUpArrays(concentric.order, "columns")
	concentric.order = joinUpArrays(concentric.order, "scroll")
	concentric.order = joinUpArrays(concentric.order, "from")
	concentric.order = joinUpArrays(concentric.order, "to")
	concentric.order = joinUpArrays(concentric.order, "via")
	concentric.order = joinDownArrays(concentric.order, "aspect")

	concentric.order = reorderStyles(concentric.order, positionStyleOrder)
	concentric.order = reorderStyles(concentric.order, displayStyleOrder)
	concentric.order = reorderStyles(concentric.order, sizeStyleOrder)
	concentric.order = reorderStyles(concentric.order, ["sr"])
	concentric.order = reorderStyles(concentric.order, ["prose"])
	concentric.order = reorderStyles(concentric.order, ["form"])
	concentric.order = reorderStyles(concentric.order, ["peer"])
	concentric.order = reorderStyles(concentric.order, ["group"])
	concentric.order = reorderStyles(concentric.order, ["dark"])
	concentric.order = reorderStyles(concentric.order, ["@container"])
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

	smacss.order = joinUpArrays(smacss.order, "@container")
	smacss.order = joinUpArrays(smacss.order, "form")
	smacss.order = joinUpArrays(smacss.order, "prose")
	smacss.order = joinUpArrays(smacss.order, "inline")
	smacss.order = joinUpArrays(smacss.order, "flex")
	smacss.order = joinUpArrays(smacss.order, "grid")
	smacss.order = joinUpArrays(smacss.order, "table", { end: 2 }) // excludes `Table Layout`
	smacss.order = joinUpArrays(smacss.order, "p")
	smacss.order = joinUpArrays(smacss.order, "px")
	smacss.order = joinUpArrays(smacss.order, "py")
	smacss.order = joinUpArrays(smacss.order, "ps")
	smacss.order = joinUpArrays(smacss.order, "pe")
	smacss.order = joinUpArrays(smacss.order, "pt")
	smacss.order = joinUpArrays(smacss.order, "pr")
	smacss.order = joinUpArrays(smacss.order, "pb")
	smacss.order = joinUpArrays(smacss.order, "pl")
	smacss.order = joinUpArrays(smacss.order, "m")
	smacss.order = joinUpArrays(smacss.order, "mx")
	smacss.order = joinUpArrays(smacss.order, "my")
	smacss.order = joinUpArrays(smacss.order, "ms")
	smacss.order = joinUpArrays(smacss.order, "me")
	smacss.order = joinUpArrays(smacss.order, "mt")
	smacss.order = joinUpArrays(smacss.order, "mr")
	smacss.order = joinUpArrays(smacss.order, "mb")
	smacss.order = joinUpArrays(smacss.order, "ml")
	smacss.order = joinUpArrays(smacss.order, "gap")
	smacss.order = joinUpArrays(smacss.order, "space")
	smacss.order = joinUpArrays(smacss.order, "divide")
	smacss.order = joinUpArrays(smacss.order, "justify")
	smacss.order = joinUpArrays(smacss.order, "bg")
	smacss.order = joinUpArrays(smacss.order, "text", { end: 2 }) // excludes `Text Overflow`
	smacss.order = joinUpArrays(smacss.order, "placeholder")
	smacss.order = joinUpArrays(smacss.order, "break")
	smacss.order = joinUpArrays(smacss.order, "underline")
	smacss.order = joinUpArrays(smacss.order, "decoration")
	smacss.order = joinUpArrays(smacss.order, "border", { mergeTo: 1 }) // excludes `Border Collapse` | `Border Spacing`
	smacss.order = joinUpArrays(smacss.order, "rounded")
	smacss.order = joinUpArrays(smacss.order, "blur")
	smacss.order = joinUpArrays(smacss.order, "filter")
	smacss.order = joinUpArrays(smacss.order, "grayscale")
	smacss.order = joinUpArrays(smacss.order, "invert")
	smacss.order = joinUpArrays(smacss.order, "sepia")
	smacss.order = joinUpArrays(smacss.order, "drop")
	smacss.order = joinUpArrays(smacss.order, "ring")
	smacss.order = joinUpArrays(smacss.order, "shadow")
	smacss.order = joinUpArrays(smacss.order, "accent")
	smacss.order = joinUpArrays(smacss.order, "backdrop")
	smacss.order = joinUpArrays(smacss.order, "caret")
	smacss.order = joinUpArrays(smacss.order, "columns")
	smacss.order = joinUpArrays(smacss.order, "scroll")
	smacss.order = joinUpArrays(smacss.order, "from")
	smacss.order = joinUpArrays(smacss.order, "to")
	smacss.order = joinUpArrays(smacss.order, "via")
	smacss.order = joinDownArrays(smacss.order, "aspect")

	smacss.order = reorderStyles(smacss.order, positionStyleOrder)
	smacss.order = reorderStyles(smacss.order, displayStyleOrder)
	smacss.order = reorderStyles(smacss.order, sizeStyleOrder)
	smacss.order = reorderStyles(smacss.order, ["sr"])
	smacss.order = reorderStyles(smacss.order, ["prose"])
	smacss.order = reorderStyles(smacss.order, ["form"])
	smacss.order = reorderStyles(smacss.order, ["peer"])
	smacss.order = reorderStyles(smacss.order, ["group"])
	smacss.order = reorderStyles(smacss.order, ["dark"])
	smacss.order = reorderStyles(smacss.order, ["@container"])
	smacss.order = smacss.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [...new Set(current.regex)],
		}))

	data += `\n"smacss": ${ JSON.stringify(smacss.order, undefined, "\t") },`
	console.log("Smacss - Repeated Properties:\n", getRepeatedProperty(smacss.order))
	/* */

	const minOut = out.replace(".", ".min.")
	const minData = JSON.stringify(JSON.parse(`{${ data.slice(0, -1) }}`))

	await writeFile(minOut, minData, { encoding: "utf8", flag: "w" })

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
