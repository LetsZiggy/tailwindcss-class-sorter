const fs = require("node:fs/promises")

const { generateRecess } = require("./order-recess")
const { generateConcentric } = require("./order-concentric")
const { generateSmacss } = require("./order-smacss")

function joinArrays (data, propertyName, { mergeTo = 0, end = 999, excludes = [] } = {}) {
	const arrIdx = data
		.map((curr) => curr[0])
		.reduce((acc, curr, idx) => {
			if (curr === propertyName) {
				acc.push(idx)
			}

			return acc
		}, [])
		.filter(
			(curr, idx) =>
				(idx >= mergeTo)
				&& (idx < end)
				&& !excludes.includes(idx),
		)

	if (arrIdx.length > 2) {
		arrIdx
			.reverse()
			.unshift(arrIdx.pop())
	}

	arrIdx
		.forEach((curr, idx) => {
			if (idx > 0) {
				data[arrIdx[0]][1] = [ ...data[arrIdx[0]][1], ...data[curr][1] ]
				data.splice(curr, 1)
			}
		})

	return data
}

function listRepeatedProp (data) {
	let list = data
		.map((curr) => curr[0])
		.reduce((acc, curr, idx) => {
			acc[curr] = (Object.prototype.hasOwnProperty.call(acc, curr))
				? acc[curr] + 1
				: 1

			return acc
		}, {})

	list = Object
		.entries(list)
		.filter((curr) => curr[1] > 1)

	return list
}

function reorderStyles (data, order) {
	const indexArr = order
		.map((elem) => {
			const index = data
				.findIndex((elemInner) => elem.includes(elemInner[0]))

			return ([ index, elem ])
		})
	const startIndex = indexArr
		.map((elem) => elem[0])
		.reduce((acc, elem) => (acc === undefined || acc > elem) ? elem : acc)
	const endIndex = indexArr
		.map((elem) => elem[0])
		.reduce((acc, elem) => (acc === undefined || acc < elem) ? elem : acc)

	return ([
		...data
			.slice(0, startIndex)
			.map((elem) => elem),
		...indexArr
			.map((elem) => elem[0])
			.reduce((acc, elem) => [ ...acc, data[elem] ], []),
		...data
			.slice(endIndex + 1)
			.map((elem) => elem),
	])
}

;(async function () {
	const positionStyleOrder = [ "static", "absolute", "relative", "fixed", "sticky" ]
	const displayStyleOrder = [ "hidden", "inline", "block", "flex", "grid", "table", "contents", "flow", "list" ]
	const sizeStyleOrder = [ "container", "w", "h" ]
	const referenceClasses = [[ "dark", [ "dark" ]], [ "group", [ "group" ]], [ "peer", [ "peer" ]]]
	let data = ``

	// Recess Order
	const recess = await generateRecess()
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
	console.log("Recess - Repeated Properties:\n", listRepeatedProp(recess.order))

	// Concentric Order
	const concentric = await generateConcentric()
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
	concentric.order = joinArrays(concentric.order, "decoration", { excludes: [ 2 ] })
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
	console.log("Concentric - Repeated Properties:\n", listRepeatedProp(concentric.order))

	// Smacss Order
	const smacss = await generateSmacss()
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
	smacss.order = joinArrays(smacss.order, "decoration", { excludes: [ 2 ] })
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
	console.log("Smacss - Repeated Properties:\n", listRepeatedProp(smacss.order))

	data = `{${ data.slice(0, -1) }\n}`

	fs.writeFile("../order_list.json", data, "utf8")
})()
