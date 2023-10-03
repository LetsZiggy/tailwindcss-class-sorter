/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-var-requires, unicorn/no-array-for-each, unicorn/prefer-top-level-await */

const { writeFile } = require("node:fs/promises")
const { getArgv } = require("./helper")
const { generateConcentric } = require("./order-concentric")
const { generateRecess } = require("./order-recess")
const { generateSmacss } = require("./order-smacss")

const source = getArgv("--src")
const stylelintrc = getArgv("--stylelintrc")
const out = getArgv("--out")

function joinArrays (data, propertyName, { mergeTo = 0, end = 999, excludes = []} = {}) {
	const arrayIndex = data
		.map((current, index) => current.group_name)
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

	if (arrayIndex.length > 2) {
		arrayIndex
			.reverse()
			.unshift(arrayIndex.pop())
	}

	arrayIndex
		.forEach((current, index) => {
			if (index > 0) {
				data[arrayIndex[0]].regex = [ ...data[arrayIndex[0]].regex, ...data[current].regex ]
				data.splice(current, 1)
			}
		})

	return data
}

function listRepeatedProperty (data) {
	let list = data
		.map((current) => current.group_name)
		.reduce((accumulator, current, index) => {
			accumulator[current] = (Object.hasOwn(accumulator, current))
				? accumulator[current] + 1
				: 1

			return accumulator
		}, {})

	list = Object
		.entries(list)
		.filter((current) => current[1] > 1)

	return list
}

function reorderStyles (data, order) {
	const indexArray = order
		.map((element) => {
			const index = data
				.findIndex((elementInner) => element.includes(elementInner.group_name))

			return ({ index, element })
		})
	const startIndex = indexArray
		.map((element) => element.index)
		.reduce((accumulator, element) => (accumulator === undefined || accumulator > element) ? element : accumulator)
	const endIndex = indexArray
		.map((element) => element.index)
		.reduce((accumulator, element) => (accumulator === undefined || accumulator < element) ? element : accumulator)

	return ([
		...data
			.slice(0, startIndex),
		...indexArray
			.map((element) => element.index)
			.reduce((accumulator, element) => [ ...accumulator, data[element] ], []),
		...data
			.slice(endIndex + 1),
	])
}

(async function () {
	const positionStyleOrder = [ "static", "absolute", "relative", "fixed", "sticky" ]
	const displayStyleOrder = [ "hidden", "inline", "block", "flex", "grid", "table", "contents", "flow", "list" ]
	const sizeStyleOrder = [ "container", "w", "h" ]
	const referenceClasses = [
		{ group_name: "dark", regex: [ "dark" ]},
		{ group_name: "group", regex: [ "group" ]},
		{ group_name: "peer", regex: [ "peer" ]},
	]
	let data = ``

	// Recess Order
	const recess = await generateRecess(source, stylelintrc)

	recess.order = reorderStyles(recess.order, positionStyleOrder)
	recess.order = reorderStyles(recess.order, displayStyleOrder)
	recess.order = reorderStyles(recess.order, sizeStyleOrder)

	recess.order = joinArrays(recess.order, "flex", { mergeTo: 1 })
	recess.order = joinArrays(recess.order, "grid", { mergeTo: 1 })
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
	recess.order = joinArrays(recess.order, "text", { end: 2 })
	recess.order = joinArrays(recess.order, "placeholder")
	recess.order = joinArrays(recess.order, "border")
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
	recess.order = joinArrays(recess.order, "from")
	recess.order = joinArrays(recess.order, "scroll")
	recess.order = joinArrays(recess.order, "to")
	recess.order = joinArrays(recess.order, "via")

	recess.order = [ ...referenceClasses, ...recess.order ]
	data += `\n"recess": ${ JSON.stringify(recess.order) },`
	console.log("Recess - Repeated Properties:\n", listRepeatedProperty(recess.order))

	// Concentric Order
	const concentric = await generateConcentric(source, stylelintrc)

	concentric.order = reorderStyles(concentric.order, positionStyleOrder)
	concentric.order = reorderStyles(concentric.order, displayStyleOrder)
	concentric.order = reorderStyles(concentric.order, sizeStyleOrder)

	concentric.order = joinArrays(concentric.order, "flex", { mergeTo: 1 })
	concentric.order = joinArrays(concentric.order, "grid", { mergeTo: 1 })
	concentric.order = joinArrays(concentric.order, "gap")
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
	concentric.order = joinArrays(concentric.order, "border")
	concentric.order = joinArrays(concentric.order, "rounded")
	concentric.order = joinArrays(concentric.order, "ring")
	concentric.order = joinArrays(concentric.order, "shadow")
	concentric.order = joinArrays(concentric.order, "text")
	concentric.order = joinArrays(concentric.order, "decoration", { excludes: [ 2 ]})
	concentric.order = joinArrays(concentric.order, "underline")
	concentric.order = joinArrays(concentric.order, "break")
	concentric.order = joinArrays(concentric.order, "placeholder")
	concentric.order = joinArrays(concentric.order, "accent")
	concentric.order = joinArrays(concentric.order, "backdrop")
	concentric.order = joinArrays(concentric.order, "blur")
	concentric.order = joinArrays(concentric.order, "caret")
	concentric.order = joinArrays(concentric.order, "drop")
	concentric.order = joinArrays(concentric.order, "fill")
	concentric.order = joinArrays(concentric.order, "from")
	concentric.order = joinArrays(concentric.order, "grayscale")
	concentric.order = joinArrays(concentric.order, "inset")
	concentric.order = joinArrays(concentric.order, "invert")
	concentric.order = joinArrays(concentric.order, "scroll")
	concentric.order = joinArrays(concentric.order, "sepia")
	concentric.order = joinArrays(concentric.order, "stroke")
	concentric.order = joinArrays(concentric.order, "to")
	concentric.order = joinArrays(concentric.order, "via")

	concentric.order = [ ...referenceClasses, ...concentric.order ]
	data += `\n"concentric": ${ JSON.stringify(concentric.order) },`
	console.log("Concentric - Repeated Properties:\n", listRepeatedProperty(concentric.order))

	// Smacss Order
	const smacss = await generateSmacss(source, stylelintrc)

	smacss.order = reorderStyles(smacss.order, positionStyleOrder)
	smacss.order = reorderStyles(smacss.order, displayStyleOrder)
	smacss.order = reorderStyles(smacss.order, sizeStyleOrder)

	smacss.order = joinArrays(smacss.order, "flex", { mergeTo: 1 })
	smacss.order = joinArrays(smacss.order, "grid", { mergeTo: 1 })
	smacss.order = joinArrays(smacss.order, "justify")
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
	smacss.order = joinArrays(smacss.order, "space")
	smacss.order = joinArrays(smacss.order, "gap")
	smacss.order = joinArrays(smacss.order, "border")
	smacss.order = joinArrays(smacss.order, "rounded")
	smacss.order = joinArrays(smacss.order, "bg")
	smacss.order = joinArrays(smacss.order, "ring")
	smacss.order = joinArrays(smacss.order, "shadow")
	smacss.order = joinArrays(smacss.order, "placeholder")
	smacss.order = joinArrays(smacss.order, "text", { end: 2 })
	smacss.order = joinArrays(smacss.order, "decoration", { excludes: [ 2 ]})
	smacss.order = joinArrays(smacss.order, "underline")
	smacss.order = joinArrays(smacss.order, "break")
	smacss.order = joinArrays(smacss.order, "accent")
	smacss.order = joinArrays(smacss.order, "backdrop")
	smacss.order = joinArrays(smacss.order, "blur")
	smacss.order = joinArrays(smacss.order, "caret")
	smacss.order = joinArrays(smacss.order, "drop")
	smacss.order = joinArrays(smacss.order, "from")
	smacss.order = joinArrays(smacss.order, "grayscale")
	smacss.order = joinArrays(smacss.order, "inset")
	smacss.order = joinArrays(smacss.order, "invert")
	smacss.order = joinArrays(smacss.order, "scroll")
	smacss.order = joinArrays(smacss.order, "sepia")
	smacss.order = joinArrays(smacss.order, "to")
	smacss.order = joinArrays(smacss.order, "via")

	smacss.order = [ ...referenceClasses, ...smacss.order ]
	data += `\n"smacss": ${ JSON.stringify(smacss.order) },`
	console.log("Smacss - Repeated Properties:\n", listRepeatedProperty(smacss.order))

	data = `{${ data.slice(0, -1) }\n}`

	writeFile(out, data, { encoding: "utf8", flag: "w" })
})()
