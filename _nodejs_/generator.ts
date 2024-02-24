/* eslint-disable unicorn/no-array-for-each */

import { exec } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { promisify } from "node:util"
import tailwindColours from "tailwindcss/colors.js"
import tailwindConfig from "./tailwind.config.js"
import type { Config as StylelintConfig } from "stylelint"

interface GeneratorArguments {
	config: StylelintConfig,
	order: Record<string, string[]>,
	source: string,
	stylelintrcPath: string,
}
export interface OrderData {
	group_name: string,
	regex: string[],
}
interface SortedClassNames {
	others: string[],
	[key: string]: string[],
}

const asyncExec = promisify(exec)

function sorting (a: string, b: string): (-1 | 0 | 1) {
	const lastCount: number = Math.min(a.length, b.length) - 1
	let count = 0
	let sort: -1 | 0 | 1 = 0

	while (count <= lastCount) {
		if (a[count] !== b[count]) {
			/** a is shorter than b */
			if (Number.isNaN(Number(a[count])) && !Number.isNaN(Number(b[count]))) {
				sort = -1
			}
			/** b is shorter than a */
			else if (!Number.isNaN(Number(a[count])) && Number.isNaN(Number(b[count]))) {
				sort = 1
			}
			else {
				sort = (a[count]! < b[count]!) ? -1 : 1
			}

			break
		}

		count++
	}

	return sort
}

export async function generator ({ config, order, source, stylelintrcPath }: GeneratorArguments): Promise<Record<"order", OrderData[]>> {
	await writeFile(stylelintrcPath, `export default ${ JSON.stringify(config) }`, { encoding: "utf8", flag: "w" })
	await asyncExec(`./node_modules/.bin/stylelint ${ source } --config ${ stylelintrcPath } --fix`)

	const sourceData: string[] | undefined = await readFile(source, { encoding: "utf8", flag: "r" })
		.then((string_: string) => string_.split("\n"))
		.catch((error: Error) => {
			throw new Error(`${ error.name }: ${ error.message }`)
		})

	const propertyOrder = Object.keys(order)

	if (propertyOrder.length === 0) {
		throw new Error(`"order" is empty`)
	}

	// Sort classes according to their first standard style property
	const css: SortedClassNames = sourceData.reduce((accumulator: SortedClassNames, current: string): SortedClassNames => {
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
	}, { ...order, others: [] })

	// Ensure more specific classes comes first (with more style properties)
	// Ensure letters comes before numbers
	propertyOrder
		.forEach((property: string) => {
			css[property]!
				.sort((a: string, b: string) => {
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

	// Ensure screens are grouped together for breakpoint sorting excluding [2xl, ...]
	const screenList = ["xs", ...Object.keys(tailwindConfig.theme.screens)]
		.filter((current: string): boolean => current.search(/\dxl/g) === -1)
		.map((current: string): string => `(?:${ current })`)
		.join("|")
	const screenRegex = new RegExp(`-(?<!\\()(${ screenList })(?![a-z]|\\))`)

	// Ensure corners are grouped together
	// const cornerWordVerticalList = ["top-left", "top-right", "bottom-left", "bottom-right"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const cornerWordVerticalInsetRegex = new RegExp(`-(?<!\\()(${ cornerWordVerticalList })(?![a-z]|\\))-`)
	// const cornerWordVerticalEndRegex = new RegExp(`-(?<!\\()(${ cornerWordVerticalList })(?![a-z]|\\))$`)

	// const cornerWordHorizontalList = ["left-top", "left-bottom", "right-top", "right-bottom"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const cornerWordHorizontalInsetRegex = new RegExp(`-(?<!\\()(${ cornerWordHorizontalList })(?![a-z]|\\))-`)
	// const cornerWordHorizontalEndRegex = new RegExp(`-(?<!\\()(${ cornerWordHorizontalList })(?![a-z]|\\))$`)

	// const cornerLetterList = ["tl", "tr", "bl", "br"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const cornerLetterInsetRegex = new RegExp(`-(?<!\\()(${ cornerLetterList })(?![a-z]|\\))-`)
	// const cornerLetterEndRegex = new RegExp(`-(?<!\\()(${ cornerLetterList })(?![a-z]|\\))$`)

	// const cornerLogicalLetterList = ["ss", "se", "ee", "es"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const cornerLogicalLetterInsetRegex = new RegExp(`-(?<!\\()(${ cornerLogicalLetterList })(?![a-z]|\\))-`)
	// const cornerLogicalLetterEndRegex = new RegExp(`-(?<!\\()(${ cornerLogicalLetterList })(?![a-z]|\\))$`)

	// Ensure `top | right | bottom | left | start | end` are grouped together
	// const directionWordList = ["top", "right", "bottom", "left"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const directionWordInsetRegex = new RegExp(`(?<=[a-z0-9])-(?<!\\()(${ directionWordList })(?![a-z]|\\))-`)
	// const directionWordEndRegex = new RegExp(`(?<=[a-z0-9])-(?<!\\()(${ directionWordList })(?![a-z]|\\))$`)

	// const directionLetterList = ["t", "r", "b", "l"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const directionLetterInsetRegex = new RegExp(`-(?<!\\()(${ directionLetterList })(?![a-z]|\\))-`)
	// const directionLetterEndRegex = new RegExp(`-(?<!\\()(${ directionLetterList })(?![a-z]|\\))$`)

	// const directionLogicalLetterList = ["s", "e"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const directionLogicalLetterInsetRegex = new RegExp(`-(?<!\\()(${ directionLogicalLetterList })(?![a-z]|\\))-`)
	// const directionLogicalLetterEndRegex = new RegExp(`-(?<!\\()(${ directionLogicalLetterList })(?![a-z]|\\))$`)

	// Ensure `row | col` are grouped together
	// const rowcolPluralList = ["rows", "cols"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const rowcolPluralInsetRegex = new RegExp(`-(?<!\\()(${ rowcolPluralList })(?![a-z]|\\))-`)
	// const rowcolPluralEndRegex = new RegExp(`-(?<!\\()(${ rowcolPluralList })(?![a-z]|\\))`)

	// const rowcolSingularList = ["row", "col"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const rowcolSingularInsetRegex = new RegExp(`-(?<!\\()(${ rowcolSingularList })(?![a-z]|\\))-`)
	// const rowcolSingularEndRegex = new RegExp(`-(?<!\\()(${ rowcolSingularList })(?![a-z]|\\))`)

	// Ensure `start | end` are grouped together
	// const startendList = ["start", "end"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const startendInsetRegex = new RegExp(`-(?<!\\()(${ startendList })(?![a-z]|\\))-`)
	// const startendEndRegex = new RegExp(`-(?<!\\()(${ startendList })(?![a-z]|\\))`)

	// Ensure `x | y` are grouped together
	// const xyList = ["x", "y"]
	// .map((current: string) => `(?:${ current })`)
	// .join("|")
	// const xyInsetRegex = new RegExp(`-(?<!\\()(${ xyList })(?![a-z]|\\))-`)
	// const xyEndRegex = new RegExp(`-(?<!\\()(${ xyList })(?![a-z]|\\))$`)

	// Ensure colours are grouped together
	const colourMonoList = ["inherit", "transparent", "current", "black", "white"]
		.map((current: string) => `(?:${ current })`)
		.join("|")
	const colourMonoRegex = new RegExp(`-(?<!\\()(${ colourMonoList })(?![a-z]|\\))`)

	const colourShadeList = Object.keys(tailwindColours)
		.filter((current: string) => !["inherit", "transparent", "current", "black", "white"].includes(current))
		.sort((a: string, b: string) => (a.length < b.length) ? 1 : -1)
		.map((current: string) => current.toLowerCase())
		.map((current: string) => `(?:${ current })`)
		.join("|")
	const colourShadeRegex = new RegExp(`-(?<!\\()(${ colourShadeList })(?![a-z]|\\))`)

	// Ensure fontWeight are grouped together
	const fontWeightList = Object.keys(tailwindConfig.theme.fontWeight)
		.sort((a: string, b: string) => (a.length < b.length) ? 1 : -1)
		.map((current: string) => `(?:${ current })`)
		.join("|")
	const fontWeightRegex = new RegExp(`(?<=font)-(?<!\\()(${ fontWeightList })(?![a-z]|\\))`)

	// Ensure letterSpacing are grouped together
	const letterSpacingList = Object.keys(tailwindConfig.theme.letterSpacing)
		.sort((a: string, b: string) => (a.length < b.length) ? 1 : -1)
		.map((current: string) => `(?:${ current })`)
		.join("|")
	const letterSpacingRegex = new RegExp(`(?<=tracking)-(?<!\\()(${ letterSpacingList })(?![a-z]|\\))`)

	// Ensure lineHeight are grouped together
	const lineHeightList = Object.keys(tailwindConfig.theme.lineHeight)
		.filter((current: string) => !Number.isInteger(Number(current)))
		.map((current: string) => `(?:${ current })`)
		.join("|")
	const lineHeightRegex = new RegExp(`(?<=leading)-(?<!\\()(${ lineHeightList })(?![a-z]|\\))`)

	// Ensure fontSize and lineHeight shorthand is available
	const fontSizeList = [
		...Object.keys(tailwindConfig.theme.fontSize).filter((current: string) => current.search(/^\d+xl/) === -1),
		String.raw`\d{1,4}xl`,
	]
	.map((current: string) => `(?:${ current })`)
	.join("|")
	const lineHeightListNumber = [
		...Object.keys(tailwindConfig.theme.lineHeight).filter((current: string) => !Number.isInteger(Number(current))),
		String.raw`\d{1,4}`,
	]
	.map((current: string) => `(?:${ current })`)
	.join("|")
	const fontSizeShorthandRegex = new RegExp(`(?<=text)-(?<!\\()(${ fontSizeList })(?![a-z]|\\))`)

	// Ensure classes are `https://github.com/dlclark/regexp2` regex compatible
	;[...propertyOrder, "others"]
		.forEach((property: string) => {
			css[property] = css[property]!
				.map((current: string) => current
					.split(" {")[0]! // Remove all but class names /* current.includes(" >") ? " >" : " {"*/
					.slice(1) // Removes dot (css class identifier)
					// .replaceAll("\\", "\\") // Escape backslash in css names - NEED TO RE-EVALUATE REGEX
					.replaceAll(/\d+/g, String.raw`\d{1,4}`) // Replace numbers to \d{4}
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
				.map((current: string) => (current.startsWith("-")
					? `-{0,1}${ current.slice(1) }`
					: current)) // Add optional negative `-{0,1}` for classes with negative prefix
				.map((current: string) => ((!current.startsWith("-{0,1}") && current.includes(String.raw`\d`) && !current.includes("gray") && !current.includes("black"))
					? `-{0,1}${ current }`
					: current)) // Add optional negative `-{0,1}` for classes with numbers that are not colours
				.filter((current: string, _, array: string[]) => !(!current.startsWith("-{0,1}") && array.includes(`-{0,1}${ current }`))) // Remove redundant classes after adding optional negative `-{0,1}`
		})

	// Ensure less hyphens comes before more hyphens
	// Ensure letters comes before numbers
	// Ensure classes are sorted alphabetically
	propertyOrder
		.forEach((property: string) => {
			css[property]!
				.sort((a: string, b: string) => {
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
		.sort((a: string, b: string) => {
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
	let flattened: string[] = [...propertyOrder, "others"]
		.reduce((accumulator: string[], current: string) => {
			const properties = css[current]!.filter((string_: string) => string_ !== "")

			return ([...accumulator, ...properties])
		}, [])

	// Remove duplicates
	flattened = [...new Set(flattened)]

	// Group similar classes for quicker matches using list of lists
	const list: OrderData[] = flattened
		.reduce((accumulator: OrderData[], current: string) => {
			const string_ = current
				.slice((current.startsWith("-{0,1}")) ? 6 : 0)
				.split("-")
			const key: string = string_[(["no", "not", "min", "max", "auto"].includes(string_[0]!)) ? 1 : 0]!

			switch (key) {
				case accumulator?.at(-1)?.group_name: {
					accumulator.at(-1)!.regex.push(current)

					break
				}

				case accumulator?.at(-2)?.group_name: {
					accumulator.at(-2)!.regex.push(current)

					break
				}

				case accumulator?.at(-3)?.group_name: {
					accumulator.at(-3)!.regex.push(current)

					break
				}

				default: {
					accumulator.push({ group_name: key, regex: [current] })
				}
			}

			return accumulator
		}, [])

	return ({ order: list })
}
