/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-var-requires, unicorn/no-array-for-each */

const { exec } = require("node:child_process")
const { readFile, writeFile } = require("node:fs/promises")
const { promisify } = require("node:util")
const tailwindColours = require("tailwindcss/colors")
const tailwindConfig = require("./tailwind.config")

const asyncExec = promisify(exec)

function sorting (a, b) {
	const maxLength = (a.length < b.length)
		? a.length
		: b.length
	let sort = 0
	let count = 0

	while (count < maxLength) {
		if (a[count] !== b[count]) {
			if (Number.isNaN(Number(a[count])) && !Number.isNaN(Number(b[count]))) {
				sort = -1
			}
			else if (!Number.isNaN(Number(a[count])) && Number.isNaN(Number(b[count]))) {
				sort = 1
			}
			else {
				sort = (a[count] < b[count])
					? -1
					: 1
			}

			break
		}

		count++
	}

	return sort
}

async function generator ({ config, order, src, stylelintrc }) {
	await writeFile(stylelintrc, `"use strict"\nmodule.exports = ${ JSON.stringify(config) }`, { encoding: "utf8", flag: "w" })
	await asyncExec(`./node_modules/.bin/stylelint ${ src } --config ${ stylelintrc } --fix`)

	let css = await readFile(src, { encoding: "utf8", flag: "r" })
		.then((string_) => string_.split("\n"))
		.catch((error) => { console.log(`${ error.name }: ${ error.message }`) })
		?? undefined

	const propertyOrder = Object.keys(order)

	// Sort classes according to their first standard style property
	css = css.reduce((accumulator, current) => {
		let isFound = false

		for (const property of propertyOrder) {
			if (current.includes(` ${ property }: `)) {
				accumulator[property].push(current)
				isFound = true

				break
			}
		}

		if (!isFound) {
			accumulator.others.push(current)
		}

		return accumulator
	}, { ...order, others: []})

	// Ensure more specific classes comes first (with more style properties)
	// Ensure letters comes before numbers
	propertyOrder
		.forEach((property) => {
			css[property]
				.sort((a, b) => {
					const baseA = a
						.replace(/^\.-/, ".")
						// .replaceAll(/\s--tw-[\da-z-]+:\s[\d%.a-z]+;\s/g, " ") // Handled by prepare-css.js
					const baseB = b
						.replace(/^\.-/, ".")
						// .replaceAll(/\s--tw-[\da-z-]+:\s[\d%.a-z]+;\s/g, " ") // Handled by prepare-css.js
					const lengthA = baseA.match(/;/g)?.length ?? 0
					const lengthB = baseB.match(/;/g)?.length ?? 0

					if (lengthA !== lengthB) {
						return ((lengthA > lengthB) ? -1 : 1)
					}

					return (sorting(baseA, baseB))
				})
		})

	// Ensure screens are grouped together for breakpoint sorting excluding [ 2xl, ... ]
	const screenList = [ "xs", ...Object.keys(tailwindConfig.theme.screens) ]
		.filter((current) => current.search(/\dxl/g) === -1)
		.map((current) => `(?:${ current })`)
		.join("|")
	const screenRegex = new RegExp(`-(?<!\\()(${ screenList })(?![a-z]|\\))`)

	// Ensure corners are grouped together
	// const cornerWordVerticalList = [ "top-left", "top-right", "bottom-left", "bottom-right" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const cornerWordVerticalInsetRegex = new RegExp(`-(?<!\\()(${ cornerWordVerticalList })(?![a-z]|\\))-`)
	// const cornerWordVerticalEndRegex = new RegExp(`-(?<!\\()(${ cornerWordVerticalList })(?![a-z]|\\))$`)

	// const cornerWordHorizontalList = [ "left-top", "left-bottom", "right-top", "right-bottom" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const cornerWordHorizontalInsetRegex = new RegExp(`-(?<!\\()(${ cornerWordHorizontalList })(?![a-z]|\\))-`)
	// const cornerWordHorizontalEndRegex = new RegExp(`-(?<!\\()(${ cornerWordHorizontalList })(?![a-z]|\\))$`)

	// const cornerLetterList = [ "tl", "tr", "bl", "br" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const cornerLetterInsetRegex = new RegExp(`-(?<!\\()(${ cornerLetterList })(?![a-z]|\\))-`)
	// const cornerLetterEndRegex = new RegExp(`-(?<!\\()(${ cornerLetterList })(?![a-z]|\\))$`)

	// const cornerLogicalLetterList = [ "ss", "se", "ee", "es" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const cornerLogicalLetterInsetRegex = new RegExp(`-(?<!\\()(${ cornerLogicalLetterList })(?![a-z]|\\))-`)
	// const cornerLogicalLetterEndRegex = new RegExp(`-(?<!\\()(${ cornerLogicalLetterList })(?![a-z]|\\))$`)

	// Ensure `top | right | bottom | left | start | end` are grouped together
	// const directionWordList = [ "top", "right", "bottom", "left" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const directionWordInsetRegex = new RegExp(`(?<=[a-z0-9])-(?<!\\()(${ directionWordList })(?![a-z]|\\))-`)
	// const directionWordEndRegex = new RegExp(`(?<=[a-z0-9])-(?<!\\()(${ directionWordList })(?![a-z]|\\))$`)

	// const directionLetterList = [ "t", "r", "b", "l" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const directionLetterInsetRegex = new RegExp(`-(?<!\\()(${ directionLetterList })(?![a-z]|\\))-`)
	// const directionLetterEndRegex = new RegExp(`-(?<!\\()(${ directionLetterList })(?![a-z]|\\))$`)

	// const directionLogicalLetterList = [ "s", "e" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const directionLogicalLetterInsetRegex = new RegExp(`-(?<!\\()(${ directionLogicalLetterList })(?![a-z]|\\))-`)
	// const directionLogicalLetterEndRegex = new RegExp(`-(?<!\\()(${ directionLogicalLetterList })(?![a-z]|\\))$`)

	// Ensure `row | col` are grouped together
	// const rowcolPluralList = [ "rows", "cols" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const rowcolPluralInsetRegex = new RegExp(`-(?<!\\()(${ rowcolPluralList })(?![a-z]|\\))-`)
	// const rowcolPluralEndRegex = new RegExp(`-(?<!\\()(${ rowcolPluralList })(?![a-z]|\\))`)

	// const rowcolSingularList = [ "row", "col" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const rowcolSingularInsetRegex = new RegExp(`-(?<!\\()(${ rowcolSingularList })(?![a-z]|\\))-`)
	// const rowcolSingularEndRegex = new RegExp(`-(?<!\\()(${ rowcolSingularList })(?![a-z]|\\))`)

	// Ensure `start | end` are grouped together
	// const startendList = [ "start", "end" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const startendInsetRegex = new RegExp(`-(?<!\\()(${ startendList })(?![a-z]|\\))-`)
	// const startendEndRegex = new RegExp(`-(?<!\\()(${ startendList })(?![a-z]|\\))`)

	// Ensure `x | y` are grouped together
	// const xyList = [ "x", "y" ]
	// .map((current) => `(?:${ current })`)
	// .join("|")
	// const xyInsetRegex = new RegExp(`-(?<!\\()(${ xyList })(?![a-z]|\\))-`)
	// const xyEndRegex = new RegExp(`-(?<!\\()(${ xyList })(?![a-z]|\\))$`)

	// Ensure colours are grouped together
	const colourMonoList = [ "inherit", "transparent", "current", "black", "white" ]
		.map((current) => `(?:${ current })`)
		.join("|")
	const colourMonoRegex = new RegExp(`-(?<!\\()(${ colourMonoList })(?![a-z]|\\))`)

	const colourShadeList = Object.keys(tailwindColours)
		.filter((current) => ![ "inherit", "transparent", "current", "black", "white" ].includes(current))
		.sort((a, b) => (a.length < b.length) ? 1 : -1)
		.map((current) => current.toLowerCase())
		.map((current) => `(?:${ current })`)
		.join("|")
	const colourShadeRegex = new RegExp(`-(?<!\\()(${ colourShadeList })(?![a-z]|\\))`)

	// Ensure fontWeight are grouped together
	const fontWeightList = Object.keys(tailwindConfig.theme.fontWeight)
		.sort((a, b) => (a.length < b.length) ? 1 : -1)
		.map((current) => `(?:${ current })`)
		.join("|")
	const fontWeightRegex = new RegExp(`(?<=font)-(?<!\\()(${ fontWeightList })(?![a-z]|\\))`)

	// Ensure letterSpacing are grouped together
	const letterSpacingList = Object.keys(tailwindConfig.theme.letterSpacing)
		.sort((a, b) => (a.length < b.length) ? 1 : -1)
		.map((current) => `(?:${ current })`)
		.join("|")
	const letterSpacingRegex = new RegExp(`(?<=tracking)-(?<!\\()(${ letterSpacingList })(?![a-z]|\\))`)

	// Ensure lineHeight are grouped together
	const lineHeightList = Object.keys(tailwindConfig.theme.lineHeight)
		.filter((current) => !Number.isInteger(Number(current)))
		.map((current) => `(?:${ current })`)
		.join("|")
	const lineHeightRegex = new RegExp(`(?<=leading)-(?<!\\()(${ lineHeightList })(?![a-z]|\\))`)

	// Ensure fontSize and lineHeight shorthand is available
	const fontSizeList = [
		...Object.keys(tailwindConfig.theme.fontSize).filter((current) => current.search(/^\d+xl/) === -1),
		"\\d{1,4}xl",
	]
	.map((current) => `(?:${ current })`)
	.join("|")
	const lineHeightListNumber = [
		...Object.keys(tailwindConfig.theme.lineHeight).filter((current) => !Number.isInteger(Number(current))),
		"\\d{1,4}",
	]
	.map((current) => `(?:${ current })`)
	.join("|")
	const fontSizeShorthandRegex = new RegExp(`(?<=text)-(?<!\\()(${ fontSizeList })(?![a-z]|\\))`)

	// Ensure classes are `https://github.com/dlclark/regexp2` regex compatible
	;[ ...propertyOrder, "others" ]
		.forEach((property) => {
			css[property] = css[property]
				.map((current) => current
					.split(" {")[0] // Remove all but class names /* current.includes(" >") ? " >" : " {"*/
					.slice(1) // Removes dot (css class identifier)
					// .replaceAll("\\", "\\") // Escape backslash in css names - NEED TO RE-EVALUATE REGEX
					.replaceAll(/\d+/g, "\\d{1,4}") // Replace numbers to \d{4}
					.replace(screenRegex, `-(${ screenList })`)
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
					// .replace(rowcolPluralInsetRegex,`-(${ rowcolPluralList })-`)
					// .replace(rowcolPluralEndRegex,`-(${ rowcolPluralList })`)
					// .replace(rowcolSingularInsetRegex,`-(${ rowcolSingularList })-`)
					// .replace(rowcolSingularEndRegex,`-(${ rowcolSingularList })`)
					// .replace(startendInsetRegex,`-(${ startendList })-`)
					// .replace(startendEndRegex,`-(${ startendList })`)
					// .replace(xyInsetRegex, `-(${ xyList })-`)
					// .replace(xyEndRegex, `-(${ xyList })`)
					.replace(colourMonoRegex, `-(${ colourMonoList })`)
					.replace(colourShadeRegex, `-(${ colourShadeList })`)
					.replace(fontWeightRegex, `-(${ fontWeightList })`)
					.replace(letterSpacingRegex, `-(${ letterSpacingList })`)
					.replace(lineHeightRegex, `-(${ lineHeightList })`)
					.replace(fontSizeShorthandRegex, `-(${ fontSizeList })\\/((${ lineHeightListNumber })|(\\[\\d{1,4}[A-Za-z]{1,4}\\])){0,1}`))
				.map((current) => (current.startsWith("-")
					? `-{0,1}${ current.slice(1) }`
					: current)) // Add optional negative `-{0,1}` for classes with negative prefix
				.map((current) =>
					((!current.startsWith("-{0,1}") && current.includes("\\d") && !current.includes("gray") && !current.includes("black"))
						? `-{0,1}${ current }`
						: current)) // Add optional negative `-{0,1}` for classes with numbers that are not colours
				.filter((current, index, array) =>
					!(!current.startsWith("-{0,1}") && array.includes(`-{0,1}${ current }`))) // Remove redundant classes after adding optional negative `-{0,1}`
		})

	// Ensure less hyphens comes before more hyphens
	// Ensure letters comes before numbers
	// Ensure classes are sorted alphabetically
	propertyOrder
		.forEach((property) => {
			css[property]
				.sort((a, b) => {
					const baseA = a
						.replace(/^-/, "")
						// .replaceAll(/\s--tw-[\da-z-]+:\s[\d%.a-z]+;\s/g, " ") // Handled by prepare-css.js
					const baseB = b
						.replace(/^-/, "")
						// .replaceAll(/\s--tw-[\da-z-]+:\s[\d%.a-z]+;\s/g, " ") // Handled by prepare-css.js
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

					return (sorting(baseA, baseB))
				})
		})

	// Ensure letters comes before numbers
	// Ensure classes are sorted alphabetically
	css.others
		.sort((a, b) => {
			const baseA = a
				.replace(/^-/, "")
				// .replaceAll(/\s--tw-[\da-z-]+:\s[\d%.a-z]+;\s/g, " ") // Handled by prepare-css.js
			const baseB = b
				.replace(/^-/, "")
				// .replaceAll(/\s--tw-[\da-z-]+:\s[\d%.a-z]+;\s/g, " ") // Handled by prepare-css.js
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

			return (sorting(baseA, baseB))
		})

	// Flatten sorted arrays
	let flattened = [ ...propertyOrder, "others" ]
		.reduce((accumulator, current) => {
			const properties = css[current]
				.filter((string_) => string_.length > 0)

			return ([ ...accumulator, ...properties ])
		}, [])

	// Remove duplicates
	flattened = [ ...new Set(flattened) ]

	// Group similar classes for quicker matches using list of lists
	const list = flattened
		.reduce((accumulator, current, index) => {
			const string_ = current
				.slice((current.indexOf("-{0,1}") === 0) ? 6 : 0)
				.split("-")
			const key = string_[(string_[0].length > 0 && ![ "no", "not", "min", "max", "auto" ].includes(string_[0])) ? 0 : 1]

			switch (key) {
				case accumulator?.at(-1)?.group_name: {
					accumulator.at(-1).regex.push(current)

					break
				}
				case accumulator?.at(-2)?.group_name: {
					accumulator.at(-2).regex.push(current)

					break
				}
				case accumulator?.at(-3)?.group_name: {
					accumulator.at(-3).regex.push(current)

					break
				}
				default: {
					accumulator.push({ group_name: key, regex: [ current ]})
				}
			}

			return accumulator
		}, [])

	return ({ order: list })
}

module.exports = {
	generator,
}
