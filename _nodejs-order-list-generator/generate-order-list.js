/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-var-requires, unicorn/no-array-for-each, unicorn/prefer-top-level-await */

const { writeFile } = require("node:fs/promises")
const { getArgv } = require("./helper")
const { generateConcentric } = require("./order-concentric")
const { generateRecess } = require("./order-recess")
const { generateSmacss } = require("./order-smacss")

const source = getArgv("--src")
const stylelintrc = getArgv("--stylelintrc")
const out = getArgv("--out")

function listRepeatedProperty (data) {
	let list = data
		.map((current) => current.group_name)
		.reduce((accumulator, current) => {
			accumulator[current] = (Object.hasOwn(accumulator, current))
				? accumulator[current] + 1
				: 1

			return accumulator
		}, {})

	list = Object.entries(list)
		.filter((current) => current[1] > 1)

	return list
}

function joinArrays (data, propertyName, { mergeTo = 0, end = 999, excludes = []} = {}) {
	const indexList = data
		.map((current) => current.group_name)
		.reduce((accumulator, current, index) => {
			if (current === propertyName) {
				accumulator.push(index)
			}

			return accumulator
		}, [])
		.filter((current, index) =>
			(index >= mergeTo)
				&& (index < end)
				&& !excludes.includes(index))

	const groupMerged = indexList
		.map((current) => data[current])
		.reduce((accumulator, current) => {
			if (accumulator.group_name === "") {
				accumulator.group_name = current?.group_name ?? ""
			}

			accumulator.regex = [ ...accumulator.regex, ...current.regex ]

			return accumulator
		}, { group_name: "", regex: []})

	// Remove later items first
	for (const index of indexList.toSorted((a, b) => b - a)) {
		data.splice(index, 1)
	}

	data.splice(
		indexList.toSorted((a, b) => a - b).at(0),
		0,
		groupMerged,
	)

	return data
}

function reorderStyles (data, order) {
	const indexList = order
		.map((current) => data.findIndex((current_) => current === current_.group_name))

	const groupsArray = indexList
		.reduce((accumulator, current) => [ ...accumulator, data[current] ], [])

	if (order.length === 1) {
		data.splice(indexList.at(0), 1)
		data.splice(0, 0, ...groupsArray)

		return data
	}

	// Remove later items first
	for (const index of indexList.toSorted((a, b) => b - a)) {
		data.splice(index, 1)
	}

	data.splice(
		indexList.toSorted((a, b) => a - b).at(0),
		0,
		...groupsArray,
	)

	return data
}

(async function () {
	const positionStyleOrder = [ "static", "absolute", "relative", "fixed", "sticky" ]
	const displayStyleOrder = [ "hidden", "inline", "block", "flex", "grid", "table", "contents", "flow", "list" ]
	const sizeStyleOrder = [ "container", "w", "h" ]

	const referenceClasses = [
		{ group_name: "dark", regex: [ "dark" ]},
		{ group_name: "group", regex: [ "group", "group/[\\dA-Za-z]{1,}" ]},
		{ group_name: "peer", regex: [ "peer", "peer/[\\dA-Za-z]{1,}" ]},
	]
	const proseClasses = [
		{ group_name: "prose", regex: [ "prose", "prose-invert", "not-prose" ]},
	]
	const containerClasses = [
		{ group_name: "@container", regex: [ "@container", "@container-normal", "@container/[\\dA-Za-z]{1,}" ]},
	]
	let data = ``

	/**/
	// Recess Order
	const recess = await generateRecess(source, stylelintrc)

	recess.order = [ ...referenceClasses, ...containerClasses, ...proseClasses, ...recess.order ]

	recess.order = joinArrays(recess.order, "@container")
	recess.order = joinArrays(recess.order, "form")
	recess.order = joinArrays(recess.order, "prose")
	recess.order = joinArrays(recess.order, "inline")
	recess.order = joinArrays(recess.order, "flex")
	recess.order = joinArrays(recess.order, "grid")
	recess.order = joinArrays(recess.order, "table", { end: 2 }) // excludes `Table Layout`
	recess.order = joinArrays(recess.order, "p")
	recess.order = joinArrays(recess.order, "px")
	recess.order = joinArrays(recess.order, "py")
	recess.order = joinArrays(recess.order, "ps")
	recess.order = joinArrays(recess.order, "pe")
	recess.order = joinArrays(recess.order, "pt")
	recess.order = joinArrays(recess.order, "pr")
	recess.order = joinArrays(recess.order, "pb")
	recess.order = joinArrays(recess.order, "pl")
	recess.order = joinArrays(recess.order, "m")
	recess.order = joinArrays(recess.order, "mx")
	recess.order = joinArrays(recess.order, "my")
	recess.order = joinArrays(recess.order, "ms")
	recess.order = joinArrays(recess.order, "me")
	recess.order = joinArrays(recess.order, "mt")
	recess.order = joinArrays(recess.order, "mr")
	recess.order = joinArrays(recess.order, "mb")
	recess.order = joinArrays(recess.order, "ml")
	recess.order = joinArrays(recess.order, "space")
	recess.order = joinArrays(recess.order, "bg")
	recess.order = joinArrays(recess.order, "text", { end: 2 }) // excludes `Text Overflow`
	recess.order = joinArrays(recess.order, "placeholder")
	recess.order = joinArrays(recess.order, "border", { mergeTo: 1 }) // excludes `Border Collapse` | `Border Spacing`
	recess.order = joinArrays(recess.order, "rounded")
	recess.order = joinArrays(recess.order, "blur")
	recess.order = joinArrays(recess.order, "filter")
	recess.order = joinArrays(recess.order, "grayscale")
	recess.order = joinArrays(recess.order, "invert")
	recess.order = joinArrays(recess.order, "sepia")
	recess.order = joinArrays(recess.order, "drop")
	recess.order = joinArrays(recess.order, "ring")
	recess.order = joinArrays(recess.order, "shadow")
	recess.order = joinArrays(recess.order, "accent")
	recess.order = joinArrays(recess.order, "backdrop")
	recess.order = joinArrays(recess.order, "caret")
	recess.order = joinArrays(recess.order, "columns")
	recess.order = joinArrays(recess.order, "scroll")
	recess.order = joinArrays(recess.order, "from")
	recess.order = joinArrays(recess.order, "to")
	recess.order = joinArrays(recess.order, "via")

	recess.order = reorderStyles(recess.order, positionStyleOrder)
	recess.order = reorderStyles(recess.order, displayStyleOrder)
	recess.order = reorderStyles(recess.order, sizeStyleOrder)
	recess.order = reorderStyles(recess.order, [ "sr" ])
	recess.order = reorderStyles(recess.order, [ "prose" ])
	recess.order = reorderStyles(recess.order, [ "form" ])
	recess.order = reorderStyles(recess.order, [ "peer" ])
	recess.order = reorderStyles(recess.order, [ "group" ])
	recess.order = reorderStyles(recess.order, [ "dark" ])
	recess.order = reorderStyles(recess.order, [ "@container" ])
	recess.order = recess.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [ ...new Set(current.regex) ],
		}))

	data += `\n"recess": ${ JSON.stringify(recess.order, undefined, "\t") },`
	console.log("Recess - Repeated Properties:\n", listRepeatedProperty(recess.order))
	/**/

	/**/
	// Concentric Order
	const concentric = await generateConcentric(source, stylelintrc)

	concentric.order = [ ...referenceClasses, ...containerClasses, ...proseClasses, ...concentric.order ]

	concentric.order = joinArrays(concentric.order, "@container")
	concentric.order = joinArrays(concentric.order, "form")
	concentric.order = joinArrays(concentric.order, "prose")
	concentric.order = joinArrays(concentric.order, "inline")
	concentric.order = joinArrays(concentric.order, "flex")
	concentric.order = joinArrays(concentric.order, "grid")
	concentric.order = joinArrays(concentric.order, "table", { end: 2 }) // excludes `Table Layout`
	concentric.order = joinArrays(concentric.order, "p")
	concentric.order = joinArrays(concentric.order, "px")
	concentric.order = joinArrays(concentric.order, "py")
	concentric.order = joinArrays(concentric.order, "ps")
	concentric.order = joinArrays(concentric.order, "pe")
	concentric.order = joinArrays(concentric.order, "pt")
	concentric.order = joinArrays(concentric.order, "pr")
	concentric.order = joinArrays(concentric.order, "pb")
	concentric.order = joinArrays(concentric.order, "pl")
	concentric.order = joinArrays(concentric.order, "m")
	concentric.order = joinArrays(concentric.order, "mx")
	concentric.order = joinArrays(concentric.order, "my")
	concentric.order = joinArrays(concentric.order, "ms")
	concentric.order = joinArrays(concentric.order, "me")
	concentric.order = joinArrays(concentric.order, "mt")
	concentric.order = joinArrays(concentric.order, "mr")
	concentric.order = joinArrays(concentric.order, "mb")
	concentric.order = joinArrays(concentric.order, "ml")
	concentric.order = joinArrays(concentric.order, "space")
	concentric.order = joinArrays(concentric.order, "bg")
	concentric.order = joinArrays(concentric.order, "text")
	concentric.order = joinArrays(concentric.order, "break")
	concentric.order = joinArrays(concentric.order, "decoration")
	concentric.order = joinArrays(concentric.order, "underline")
	concentric.order = joinArrays(concentric.order, "placeholder")
	// concentric.order = joinArrays(concentric.order, "border")// excludes `Border Collapse` | `Border Spacing` - NOT NEEDED
	concentric.order = joinArrays(concentric.order, "rounded")
	concentric.order = joinArrays(concentric.order, "fill")
	concentric.order = joinArrays(concentric.order, "stroke")
	concentric.order = joinArrays(concentric.order, "blur")
	concentric.order = joinArrays(concentric.order, "filter")
	concentric.order = joinArrays(concentric.order, "grayscale")
	concentric.order = joinArrays(concentric.order, "invert")
	concentric.order = joinArrays(concentric.order, "sepia")
	concentric.order = joinArrays(concentric.order, "drop")
	concentric.order = joinArrays(concentric.order, "ring")
	concentric.order = joinArrays(concentric.order, "shadow")
	concentric.order = joinArrays(concentric.order, "accent")
	concentric.order = joinArrays(concentric.order, "backdrop")
	concentric.order = joinArrays(concentric.order, "caret")
	concentric.order = joinArrays(concentric.order, "columns")
	concentric.order = joinArrays(concentric.order, "scroll")
	concentric.order = joinArrays(concentric.order, "from")
	concentric.order = joinArrays(concentric.order, "to")
	concentric.order = joinArrays(concentric.order, "via")

	concentric.order = reorderStyles(concentric.order, positionStyleOrder)
	concentric.order = reorderStyles(concentric.order, displayStyleOrder)
	concentric.order = reorderStyles(concentric.order, sizeStyleOrder)
	concentric.order = reorderStyles(concentric.order, [ "sr" ])
	concentric.order = reorderStyles(concentric.order, [ "prose" ])
	concentric.order = reorderStyles(concentric.order, [ "form" ])
	concentric.order = reorderStyles(concentric.order, [ "peer" ])
	concentric.order = reorderStyles(concentric.order, [ "group" ])
	concentric.order = reorderStyles(concentric.order, [ "dark" ])
	concentric.order = reorderStyles(concentric.order, [ "@container" ])
	concentric.order = concentric.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [ ...new Set(current.regex) ],
		}))

	data += `\n"concentric": ${ JSON.stringify(concentric.order, undefined, "\t") },`
	console.log("Concentric - Repeated Properties:\n", listRepeatedProperty(concentric.order))
	/**/

	/**/
	// Smacss Order
	const smacss = await generateSmacss(source, stylelintrc)

	smacss.order = [ ...referenceClasses, ...containerClasses, ...proseClasses, ...smacss.order ]

	smacss.order = joinArrays(smacss.order, "@container")
	smacss.order = joinArrays(smacss.order, "form")
	smacss.order = joinArrays(smacss.order, "prose")
	smacss.order = joinArrays(smacss.order, "inline")
	smacss.order = joinArrays(smacss.order, "flex")
	smacss.order = joinArrays(smacss.order, "grid")
	smacss.order = joinArrays(smacss.order, "table", { end: 2 }) // excludes `Table Layout`
	smacss.order = joinArrays(smacss.order, "p")
	smacss.order = joinArrays(smacss.order, "px")
	smacss.order = joinArrays(smacss.order, "py")
	smacss.order = joinArrays(smacss.order, "ps")
	smacss.order = joinArrays(smacss.order, "pe")
	smacss.order = joinArrays(smacss.order, "pt")
	smacss.order = joinArrays(smacss.order, "pr")
	smacss.order = joinArrays(smacss.order, "pb")
	smacss.order = joinArrays(smacss.order, "pl")
	smacss.order = joinArrays(smacss.order, "m")
	smacss.order = joinArrays(smacss.order, "mx")
	smacss.order = joinArrays(smacss.order, "my")
	smacss.order = joinArrays(smacss.order, "ms")
	smacss.order = joinArrays(smacss.order, "me")
	smacss.order = joinArrays(smacss.order, "mt")
	smacss.order = joinArrays(smacss.order, "mr")
	smacss.order = joinArrays(smacss.order, "mb")
	smacss.order = joinArrays(smacss.order, "ml")
	smacss.order = joinArrays(smacss.order, "gap")
	smacss.order = joinArrays(smacss.order, "space")
	smacss.order = joinArrays(smacss.order, "divide")
	smacss.order = joinArrays(smacss.order, "justify")
	smacss.order = joinArrays(smacss.order, "bg")
	smacss.order = joinArrays(smacss.order, "text", { end: 2 }) // excludes `Text Overflow`
	smacss.order = joinArrays(smacss.order, "placeholder")
	smacss.order = joinArrays(smacss.order, "break")
	smacss.order = joinArrays(smacss.order, "underline")
	smacss.order = joinArrays(smacss.order, "decoration")
	smacss.order = joinArrays(smacss.order, "border", { mergeTo: 1 }) // excludes `Border Collapse` | `Border Spacing`
	smacss.order = joinArrays(smacss.order, "rounded")
	smacss.order = joinArrays(smacss.order, "blur")
	smacss.order = joinArrays(smacss.order, "filter")
	smacss.order = joinArrays(smacss.order, "grayscale")
	smacss.order = joinArrays(smacss.order, "invert")
	smacss.order = joinArrays(smacss.order, "sepia")
	smacss.order = joinArrays(smacss.order, "drop")
	smacss.order = joinArrays(smacss.order, "ring")
	smacss.order = joinArrays(smacss.order, "shadow")
	smacss.order = joinArrays(smacss.order, "accent")
	smacss.order = joinArrays(smacss.order, "backdrop")
	smacss.order = joinArrays(smacss.order, "caret")
	smacss.order = joinArrays(smacss.order, "columns")
	smacss.order = joinArrays(smacss.order, "scroll")
	smacss.order = joinArrays(smacss.order, "from")
	smacss.order = joinArrays(smacss.order, "to")
	smacss.order = joinArrays(smacss.order, "via")

	smacss.order = reorderStyles(smacss.order, positionStyleOrder)
	smacss.order = reorderStyles(smacss.order, displayStyleOrder)
	smacss.order = reorderStyles(smacss.order, sizeStyleOrder)
	smacss.order = reorderStyles(smacss.order, [ "sr" ])
	smacss.order = reorderStyles(smacss.order, [ "prose" ])
	smacss.order = reorderStyles(smacss.order, [ "form" ])
	smacss.order = reorderStyles(smacss.order, [ "peer" ])
	smacss.order = reorderStyles(smacss.order, [ "group" ])
	smacss.order = reorderStyles(smacss.order, [ "dark" ])
	smacss.order = reorderStyles(smacss.order, [ "@container" ])
	smacss.order = smacss.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [ ...new Set(current.regex) ],
		}))

	data += `\n"smacss": ${ JSON.stringify(smacss.order, undefined, "\t") },`
	console.log("Smacss - Repeated Properties:\n", listRepeatedProperty(smacss.order))
	/**/

	const minOut = out.replace(".", ".min.")
	const minData = JSON.stringify(JSON.parse(`{${ data.slice(0, -1) }}`))

	writeFile(minOut, minData, { encoding: "utf8", flag: "w" })

	data = `{${ data.slice(0, -1) }\n}`
		.replaceAll('\n\t\t\t"', ' "')
		.replaceAll("\n\t\t]", "]")
		.replaceAll('\n\t\t"', ' "')
		.replaceAll("\n\t}", "}")
		.replaceAll("\n\t{ ", "\n\t{")
		.replaceAll('"group_name": "', '"group_name":"')
		.replaceAll('", "regex": [ ', '","regex":[')

	writeFile(out, data, { encoding: "utf8", flag: "w" })
})()
