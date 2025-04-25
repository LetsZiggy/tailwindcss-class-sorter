import assert from "node:assert"
import { exec } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { promisify } from "node:util"
import defaults from "./defaults-list.json" with { type: "json" }
import { normaliseCompareResult, skipStylesGroupsColourRemove/* , sorting */ } from "./helper.js"
import type { NonEmptyArray, Prettify } from "./helper.js"
import type { StylelintConfigOrder } from "./stylelint-config-order.js"

export interface OrderData {
	group_name: string,
	regex: string[],
}
interface ClassnameGrouping { include?: NonEmptyArray<string>, exclude?: NonEmptyArray<string>, regex: NonEmptyArray<string> }
interface SortedClassnames {
	others: string[],
	[key: string]: string[],
}

const asyncExec = promisify(exec)
const r = String.raw
const colourWhite = "-white"
const colourWhiteRegex = /-white/
const colourAbsoluteList = `-(?:${ defaults["colour-absolute"].map((current) => `(?:${ current.toLowerCase() })`).join("|") })`
const colourRed = "-red-"
const colourRedRegex = /-red-/
const colourRelativeList = `-(?:${ defaults["colour-relative"].map((current) => `(?:${ current.toLowerCase() })`).join("|") })-`
const classnamePrefixes: NonEmptyArray<string> = ["no", "not", "min", "max", "auto"]
const endSortOrder: NonEmptyArray<string> = [
	/* eslint-disable @stylistic/array-element-newline */
	"-none", "-initial", "-auto",
	...defaults["font-weight"].map((current) => `-${ current }`) as NonEmptyArray<string>,
	...defaults["letter-spacing"].map((current) => `-${ current }`) as NonEmptyArray<string>,
	...defaults["line-height"].filter((current) => current !== "none").map((current) => `-${ current }`) as NonEmptyArray<string>,
	"-hidden", "-visible", "-reverse", "-full", "-screen", "-fit", "-both",
	"-first", "-last",
	"-min", "-max",
	"-up", "-right", "-down", "-left",
	"-t", "-tr", "-r", "-br", "-b", "-bl", "-l", "-tl",
	"-x", "-y",
	"-fr", "-px", "-vh", "-vw", "-dvw", "-dvh", "-svw", "-svh", "-lvw", "-lvh", "-lh",
	r`-\d{1,4}xs`, r`-\d{1,4}xs\/\d{1,4}`, "-xs", r`-xs\/\d{1,4}`,
	"-sm", r`-sm\/\d{1,4}`,
	"-base", r`-base\/\d{1,4}`, "-md", r`-md\/\d{1,4}`,
	"-lg", r`-lg\/\d{1,4}`,
	"-xl", r`-xl\/\d{1,4}`, r`-\d{1,4}xl`, r`-\d{1,4}xl\/\d{1,4}`,
	"-white", r`-white\/\d{1,4}`, r`-red-\d{1,4}`, r`-red-\d{1,4}\/\d{1,4}`,
	r`-\d{1,4}`, r`-\d{1,4}\/\d{1,4}`, r`-\d{1,4}\%`,
	r`-\([^\)]+\)`, r`-\[[^\]]+\]`,
	/* eslint-enable @stylistic/array-element-newline */
]
const separatorSortOrders: NonEmptyArray<Prettify<ClassnameGrouping>> = [
	{ include: ["-dashed", "-dotted", "-double", "-solid"], regex: ["-hidden", "-dashed", "-dotted", "-double", "-solid", "-wavy"] },

	{ include: ["-ultra-condensed", "-extra-condensed", "-semi-condensed", "-semi-expanded", "-extra-expanded", "-ultra-expanded"], regex: ["-ultra-condensed", "-extra-condensed", "-condensed", "-semi-condensed", "-normal", "-semi-expanded", "-expanded", "-extra-expanded", "-ultra-expanded"] },

	{ include: ["-t-from-", "-b-to-", "-x-from-", "-y-to-", "-conic-", "-linear-", "-radial-"], regex: ["-t-from-", "-t-to-", "-r-from-", "-r-to-", "-b-from-", "-b-to-", "-l-from-", "-l-to-", "-x-from-", "-x-to-", "-y-from-", "-y-to-", "-conic-from-", "-conic-to-", "-conic-", "-linear-from-", "-linear-to-", "-linear-", "-radial-closest-", "-radial-farthest-", "-radial-from-", "-radial-to-", "-radial-at-center", "-radial-at-top", "-radial-at-top-right", "-radial-at-right", "-radial-at-bottom-right", "-radial-at-bottom", "-radial-at-bottom-left", "-radial-at-left", "-radial-at-top-left", "-radial-"] },

	{ include: ["-blur-", "-brightness-", "-contrast-", "-filter-", "-grayscale-", "-hue-rotate-", "-invert-", "-opacity-", "-saturate-", "-sepia-"], regex: ["-blur-", "-brightness-", "-contrast-", "-filter", "-filter-", "-grayscale", "-grayscale-", "-hue-rotate-", "-invert", "-invert-", "-opacity-", "-saturate-", "-sepia", "-sepia-"] },

	{ include: ["-light", "-dark"], regex: ["-normal", "-light", "-light-", "-dark", "-dark-"] },

	{ include: ["-from-", "-to-"], regex: ["-from-", "-to-"] },

	{ include: ["-before-", "-inside-", "-after-"], regex: ["-before-", "-inside-", "-after-"] },

	{ include: ["-stretch"], regex: ["-baseline", "-baseline-", "-around", "-between", "-evenly", "-normal", "-stretch", "-start", "-center", "-center-", "-end", "-end-"] },

	{ include: ["-columns"], exclude: ["-column", "-cols", "-col"], regex: ["-rows", "-rows-", "-columns", "-columns-"] },
	{ include: ["-columns-"], exclude: ["-column-", "-cols-", "-col-"], regex: ["-rows", "-rows-", "-columns", "-columns-"] },

	{ include: ["-column"], exclude: ["-cols", "-col", "-columns"], regex: ["-row", "-row-", "-column", "-column-"] },
	{ include: ["-column-"], exclude: ["-cols-", "-col-", "-columns-"], regex: ["-row", "-row-", "-column", "-column-"] },

	{ include: ["-cols"], exclude: ["-col", "-columns", "-column"], regex: ["-rows", "-rows-", "-cols", "-cols-"] },
	{ include: ["-cols-"], exclude: ["-col-", "-columns-", "-column-"], regex: ["-rows", "-rows-", "-cols", "-cols-"] },

	{ include: ["-col"], exclude: ["-columns", "-column", "-cols"], regex: ["-row", "-row-", "-col", "-col-"] },
	{ include: ["-col-"], exclude: ["-columns-", "-column-", "-cols-"], regex: ["-row", "-row-", "-col", "-col-"] },

	{ regex: ["-m-", "-ms-", "-me-", "-mx-", "-my-", "-mt-", "-mr-", "-mb-", "-ml-"] },
	{ regex: ["-p-", "-ps-", "-pe-", "-px-", "-py-", "-pt-", "-pr-", "-pb-", "-pl-"] },

	{ include: ["-nesw-", "-nwse-"], regex: ["-nesw-", "-nwse-", "-ns-", "-ew-", "-n-", "-ne-", "-e-", "-se-", "-s-", "-sw-", "-w-", "-nw-"] },
	{ include: ["-ss-", "-ee-", "-s-", "-e-"], exclude: ["-nesw-", "-nwse-"], regex: ["-s-", "-e-", "-ss-", "-se-", "-ee-", "-es-", "-t-", "-tl-", "-l-", "-bl-", "-b-", "-br-", "-r-", "-tr-"] },
	{ include: ["-ss-", "-ee-"], exclude: ["-s-", "-e-"], regex: ["-ss-", "-se-", "-ee-", "-es-", "-tl-", "-bl-", "-br-", "-tr-"] },
	{ include: ["-s-", "-e-"], exclude: ["-nesw-", "-nwse-"], regex: ["-s", "-s-", "-e", "-e-"] },

	{ include: ["-tr", "-br", "-bl", "-tl"], regex: ["-t", "-tr", "-r", "-br", "-b", "-bl", "-l", "-tl"] },
	{ include: ["-t-", "-l-"], regex: ["-t", "-t-", "-r", "-r-", "-b", "-b-", "-l", "-l-"] },
	{ include: ["-t-", "-b-"], exclude: ["-r-", "-l-"], regex: ["-t-", "-b-"] },
	{ include: ["-r-", "-l-"], exclude: ["-t-", "-b-"], regex: ["-r-", "-l-"] },

	{ include: ["-x", "-x-", "-y", "-y-"], regex: ["-x", "-x-", "-y", "-y-"] },
	{ include: ["-x", "-y"], exclude: ["-x-", "-y-"], regex: ["-x", "-y"] },
	{ include: ["-x-", "-y-"], exclude: ["-x", "-y"], regex: ["-x-", "-y-"] },

	{ include: ["-right-top", "-right-bottom", "-left-bottom", "-left-top"], exclude: ["-center-", "-down", "-end", "-footer"], regex: ["-center", "-top", "-top-right", "-right-top", "-right", "-bottom-right", "-right-bottom", "-bottom", "-bottom-left", "-left-bottom", "-left", "-top-left", "-left-top"] }, // Deprecated: https://github.com/tailwindlabs/tailwindcss/pull/<17378,17437>
	{ include: ["-top-right", "-bottom-right", "-bottom-left", "-top-left"], exclude: ["-center-", "-down", "-end", "-footer"], regex: ["-center", "-top", "-top-right", "-right-top", "-right", "-bottom-right", "-right-bottom", "-bottom", "-bottom-left", "-left-bottom", "-left", "-top-left", "-left-top"] }, // Deprecated: https://github.com/tailwindlabs/tailwindcss/pull/<17378,17437>

	{ include: ["-center", "-top", "-right", "-bottom", "-left"], exclude: ["-down", "-end", "-footer"], regex: ["-center", "-center-", "-top", "-top-", "-right", "-right-", "-bottom", "-bottom-", "-left", "-left-"] },

	{ include: ["-start", "-end", "-right", "-left"], exclude: ["-start-", "-end-", "-right-", "-left-"], regex: ["-start", "-end", "-right", "-center", "-left"] },

	{ include: ["-start", "-end"], exclude: ["-footer", "-right", "-down", "-bottom"], regex: ["-start", "-start-", "-center", "-center-", "-end", "-end-"] },
	{ include: ["-start-", "-end-"], exclude: ["-start", "-end"], regex: ["-start-", "-center-", "-end-"] },

	{ include: ["-right", "-left"], exclude: ["-down", "-bottom", "-end", "-footer"], regex: ["-right", "-right-", "-center", "-center-", "-left", "-left-"] },
	{ include: ["-right-", "-left-"], exclude: ["-right", "-left"], regex: ["-right-", "-center-", "-left-"] },

	{ include: ["-header", "-footer"], exclude: ["-right", "-down", "-bottom", "-end"], regex: ["-header", "-header-", "-center", "-center-", "-footer", "-footer-"] },
	{ include: ["-header-", "-footer-"], exclude: ["-header", "-footer"], regex: ["-header-", "-center-", "-footer-"] },

	{ include: ["-up", "-down"], exclude: ["-bottom", "-end", "-footer", "-right"], regex: ["-up", "-up-", "-center", "-center-", "-down", "-down-"] },
	{ include: ["-up-", "-down-"], exclude: ["-up", "-down"], regex: ["-up-", "-center-", "-down-"] },

	{ include: ["-top", "-bottom"], exclude: ["-end", "-footer", "-right", "-down"], regex: ["-top", "-top-", "-center", "-center-", "-middle", "-bottom", "-bottom-"] },
	{ include: ["-top-", "-bottom-"], exclude: ["-top", "-bottom"], regex: ["-top-", "-center-", "-bottom-"] },
]
const groupnameSortOrders: NonEmptyArray<NonEmptyArray<string>> = [
	["form"],
	["prose"],
	["start", "end"],
	["top", "right", "bottom", "left"],
	["p", "ps", "pe", "px", "py", "pt", "pr", "pb", "pl"],
	["m", "ms", "me", "mx", "my", "mt", "mr", "mb", "ml"],
	["from", "via", "to"],
	["truncate", "overflow"],
]

export async function generator (configOrder: StylelintConfigOrder, source: string, stylelintrcPath: string): Promise<Record<"order", OrderData[]>> {
	await writeFile(stylelintrcPath, `export default ${ JSON.stringify(configOrder.config) }`, { encoding: "utf8", flag: "w" })
	await asyncExec(`./node_modules/.bin/stylelint ${ source } --config ${ stylelintrcPath } --fix`)

	let classnames = [] as unknown as NonEmptyArray<string>
	let orderDatas = [] as Array<Prettify<OrderData>>

	// Add additional css properties to order (see prepare-css.ts)
	{
		const before = 0
		const after = 1
		let index

		// ### LAYOUT ###

		// --- TOP / RIGHT / BOTTOM / LEFT ---
		// `inset-#>` property to be added ---after--- `inset` property in generator.ts (see prepare-css.ts)
		index = configOrder.order.indexOf("inset")
		configOrder.order = [...configOrder.order.slice(0, index + after), "inset-#>", ...configOrder.order.slice(index + after)]

		// --- TOP / RIGHT / BOTTOM / LEFT ---
		// `inset-##>` property to be added ---after--- `inset-#>` property in generator.ts (see prepare-css.ts)
		index = configOrder.order.indexOf("inset-#>")
		configOrder.order = [...configOrder.order.slice(0, index + after), "inset-##>", ...configOrder.order.slice(index + after)]

		// ### FLEXBOX & GRID ###

		// https://github.com/tailwindlabs/tailwindcss/pull/14721
		// --- FLEX-GROW | FLEX-SHRINK ---
		// `flex-#>` property to be added ---after--- `flex` property in generator.ts (see prepare-css.ts)
		index = configOrder.order.indexOf("flex")
		configOrder.order = [...configOrder.order.slice(0, index + after), "flex-#>", ...configOrder.order.slice(index + after)]

		// ### SPACING ###

		// --- MARGIN ---
		// `<#-margin` property to be added ---before--- `margin` property in generator.ts (see prepare-css.ts)
		index = configOrder.order.indexOf("margin")
		configOrder.order = [...configOrder.order.slice(0, index + before), "<#-margin", ...configOrder.order.slice(index + before)]

		// ### SIZING ###

		// --- WIDTH | HEIGHT ---
		// `<#-width` property to be added ---before--- `width` property in generator.ts (see prepare-css.ts)
		index = configOrder.order.indexOf("width")
		configOrder.order = [...configOrder.order.slice(0, index + before), "<#-width", ...configOrder.order.slice(index + before)]

		// ### BORDERS ###

		// --- BORDER-WIDTH | BORDER-COLOR | BORDER-STYLE ---
		// `<#-border` property to be added ---before--- `border` property in generator.ts (see prepare-css.ts)
		index = configOrder.order.indexOf("border")
		configOrder.order = [...configOrder.order.slice(0, index + before), "<#-border", ...configOrder.order.slice(index + before)]

		// `<##-border` property to be added ---before--- `<#-border` property in generator.ts (see prepare-css.ts)
		index = configOrder.order.indexOf("<#-border")
		configOrder.order = [...configOrder.order.slice(0, index + before), "<##-border", ...configOrder.order.slice(index + before)]

		// --- BORDER-WIDTH | BORDER-COLOR | BORDER-STYLE ---
		// `<#-border-style` property to be added ---before--- `border-style` property in generator.ts (see prepare-css.ts)
		index = configOrder.order.indexOf("border-style")
		configOrder.order = [...configOrder.order.slice(0, index + before), "<#-border-style", ...configOrder.order.slice(index + before)]
	}

	// Get classnames from css
	{
		const sourceData: string[] | undefined = await readFile(source, { encoding: "utf8", flag: "r" })
			.then((string_: string) => string_.split("\n"))
			.catch((error: Error) => {
				throw new Error(`${ error.name }: ${ error.message }`)
			})

		if (configOrder.order.length === 0) {
			throw new Error(`"order" is empty`)
		}

		const propertiesOrder: NonEmptyArray<string> = [...configOrder.order, "others"] as unknown as NonEmptyArray<string>

		// Setup css sorting
		const css: Prettify<SortedClassnames> = propertiesOrder
			.reduce((accumulator, current) => {
				accumulator[current] = []

				return accumulator
			}, {} as SortedClassnames)

		// Collect classnames according to their first non-custom property
		for (const data of sourceData) {
			let isFound = false

			for (const property of configOrder.order) {
				assert.ok(Array.isArray(css[property]))

				if (data.includes(` ${ property }: `)) {
					css[property].push(data)
					isFound = true

					break
				}
			}

			if (!isFound) {
				css.others.push(data)
			}
		}

		// Convert classnames to regex
		for (const property of propertiesOrder) {
			assert.ok(Array.isArray(css[property]))

			const skipStyles = Object.values(skipStylesGroupsColourRemove)

			for (const index of css[property].keys()) {
				assert.ok(typeof css[property][index] === "string")

				// Ensure classnames are `https://github.com/dlclark/regexp2` regex compatible
				css[property][index] = css[property][index]
					.replace(/ \{.*$/, "") // Remove all but class names
					.replace(/^\./, "") // Removes dot (css class identifier)
					.replaceAll(/\d+/g, r`\d{1,4}`) // Replace numbers to \d{1,4}
					.replace(/-\\\([^)]+\\\)/, r`-\([^\)]+\)`) // Replace `*-(--custom-property-placeholder)`
					.replace(/-\\\[[^)]+?\\\]/, r`-\[[^\]]+\]`) // Replace `*-\\[--value-placeholder\\]`

				// Add optional negative `-{0,1}` for classnames with negative prefix
				if (css[property][index].startsWith("-")) {
					css[property][index] = `-{0,1}${ css[property][index].slice(1) }`
				}

				// Add optional negative `-{0,1}` for classnames with numbers that are not colours
				if (
					!css[property][index].startsWith("-{0,1}")
					&& css[property][index].includes(r`\d`)
					&& !css[property][index].includes(colourWhite)
					&& !css[property][index].includes(colourRed)
				) {
					css[property][index] = `-{0,1}${ css[property][index] }`
				}

				// Re-add colours (absolute | relative)
				if (!skipStyles.some((skipStyle) => css[property]![index]!.startsWith(skipStyle))) {
					if (css[property][index].includes(colourWhite)) {
						css[property][index] = css[property][index].replace(colourWhiteRegex, colourAbsoluteList)
					}

					if (css[property][index].includes(colourRed)) {
						css[property][index] = css[property][index].replace(colourRedRegex, colourRelativeList)
					}
				}
			}

			// Remove empty and redundant classnames
			css[property] = [
				...new Set(css[property].filter((current, _, array) => {
					// Remove empty strings
					if (current === "") {
						return false
					}

					// Remove redundant classnames after adding optional negative `-{0,1}`
					if (!current.startsWith("-{0,1}")) {
						return (!array.includes(`-{0,1}${ current }`))
					}

					return true
				})),
			]
		}

		// Merge related properties
		{
			const foundRelatedProperties = new Set<string>()

			for (const property of propertiesOrder) {
				assert.ok(Array.isArray(css[property]))

				// Find and merge related css properties
				{
					let commonIdentifier: string = ""
					let relatedProperties: string[] = []

					// Find related css properties
					if (css[property].length > 0 && !foundRelatedProperties.has(property)) {
						switch (true) {
							// Full property names
							// "top", "right", "bottom", "left"
							case (["top", "right", "bottom", "left"].includes(property)): {
								relatedProperties = ["top", "right", "bottom", "left"]

								break
							}

							// "width", "min-width", "max-width"
							case (["width", "min-width", "max-width"].includes(property)): {
								relatedProperties = ["width", "min-width", "max-width"]

								break
							}

							// "height", "min-height", "max-height"
							case (["height", "min-height", "max-height"].includes(property)): {
								relatedProperties = ["height", "min-height", "max-height"]

								break
							}

							// "row-gap", "column-gap"
							case (["row-gap", "column-gap"].includes(property)): {
								relatedProperties = ["row-gap", "column-gap"]

								break
							}

							// Partial property names
							// "block-", "min-block-", "max-block-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>"))
								&& (
									property.startsWith("block-")
									|| property.startsWith("min-block-")
									|| property.startsWith("max-block-")
								)
							): {
								commonIdentifier = property.replace(/^(?:(?:min|max)-)?block-/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>"))
										&& commonIdentifier === current.replace(/^(?:(?:min|max)-)?block-/, "")
									)
								})

								break
							}

							// "inline-", "min-inline-", "max-inline-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>"))
								&& (
									property.startsWith("inline-")
									|| property.startsWith("min-inline-")
									|| property.startsWith("max-inline-")
								)
							): {
								commonIdentifier = property.replace(/^(?:(?:min|max)-)?inline-/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>"))
										&& commonIdentifier === current.replace(/^(?:(?:min|max)-)?inline-/, "")
									)
								})

								break
							}

							// "border", "border-color", "border-style", "border-width", "border-block", "border-inline", "border-top", "border-right", "border-bottom", "border-left"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>"))
								&& (
									property === "border"
									|| property === "border-color"
									// || property === "border-style"
									|| property === "border-width"
									|| (
										(
											property.startsWith("border-block")
											|| property.startsWith("border-inline")
											|| property.startsWith("border-top")
											|| property.startsWith("border-right")
											|| property.startsWith("border-bottom")
											|| property.startsWith("border-left")
										) && (
											property.endsWith("color")
											|| property.endsWith("style")
											|| property.endsWith("width")
										)
									)
								)
							): {
								commonIdentifier = "border"
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>"))
										&& (
											commonIdentifier === current
											|| commonIdentifier === current.replace(/-(?:color|width)$/, "") // color|style|width
											|| commonIdentifier === current.replace(/-(?:block|inline)$/, "")
											|| commonIdentifier === current.replace(/-(?:block|inline)-(?:start|end)$/, "")
											|| commonIdentifier === current.replace(/-(?:block|inline)-(?:start|end)-(?:color|style|width)$/, "")
											|| commonIdentifier === current.replace(/-(?:top|right|bottom|left)$/, "")
											|| commonIdentifier === current.replace(/-(?:top|right|bottom|left)-(?:color|style|width)$/, "")
										)
									)
								})

								break
							}

							// "-start-start-", "-start-end-", "-end-start-", "-end-end-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.includes("-start-start-")
									|| property.includes("-start-end-")
									|| property.includes("-end-start-")
									|| property.includes("-end-end-")
								)
							): {
								commonIdentifier = property.replace(/-(?:start|end)-(?:start|end)-/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-(?:start|end)-(?:start|end)-/, "")
									)
								})

								break
							}

							// "-top-right-", "-bottom-right-", "-bottom-left-", "-top-left-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.includes("-top-right-")
									|| property.includes("-bottom-right-")
									|| property.includes("-bottom-left-")
									|| property.includes("-top-left-")
								)
							): {
								commonIdentifier = property.replace(/-(?:top|bottom)-(?:left|right)-/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-(?:top|bottom)-(?:left|right)-/, "")
									)
								})

								break
							}

							// "-block", "-block-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-block")
									|| property.includes("-block-")
								)
							): {
								commonIdentifier = property.replace(/-block(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-block(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-inline", "-inline-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-inline")
									|| property.includes("-inline-")
								)
							): {
								commonIdentifier = property.replace(/-inline(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-inline(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-grow", "-shrink"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-grow")
									|| property.endsWith("-shrink")
								)
							): {
								commonIdentifier = property.replace(/-(?:grow|shrink)(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-(?:grow|shrink)(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-rows", "-rows-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-rows")
									|| property.includes("-rows-")
								)
							): {
								commonIdentifier = property.replace(/-rows(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-rows(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-row", "-row-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-row")
									|| property.includes("-row-")
								)
							): {
								commonIdentifier = property.replace(/-row(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-row(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-columns", "-columns-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-columns")
									|| property.includes("-columns-")
								)
							): {
								commonIdentifier = property.replace(/-columns(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-columns(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-column", "-column-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-column")
									|| property.includes("-column-")
								)
							): {
								commonIdentifier = property.replace(/-column(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-column(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-cols", "-cols-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-cols")
									|| property.includes("-cols-")
								)
							): {
								commonIdentifier = property.replace(/-cols(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-cols(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-col", "-col-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-col")
									|| property.includes("-col-")
								)
							): {
								commonIdentifier = property.replace(/-col(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-col(?:-.*)?$/, "")
									)
								})

								break
							}

							// "-top", "-right", "-bottom", "-left"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-top")
									|| property.endsWith("-right")
									|| property.endsWith("-bottom")
									|| property.endsWith("-left")
								)
							): {
								commonIdentifier = property.replace(/-(?:top|right|bottom|left)$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-(?:top|right|bottom|left)$/, "")
									)
								})

								break
							}

							// "-x", "-x-", "-y", "-y-"
							case (
								!(property.startsWith("<#-") || property.endsWith("-#>") || property.startsWith("min-") || property.startsWith("max-"))
								&& (
									property.endsWith("-x")
									|| property.includes("-x-")
									|| property.endsWith("-y")
									|| property.includes("-y-")
								)
							): {
								commonIdentifier = property.replace(/-(?:x|y)(?:-.*)?$/, "")
								relatedProperties = configOrder.order.filter((current) => {
									return (
										!(current.startsWith("<#-") || current.endsWith("-#>") || current.startsWith("min-") || current.startsWith("max-"))
										&& commonIdentifier === current.replace(/-(?:x|y)(?:-.*)?$/, "")
									)
								})

								break
							}
						}
					}

					// Merge related css properties
					if (relatedProperties.length > 0 && !foundRelatedProperties.has(property)) {
						for (const relatedProperty of relatedProperties) {
							assert.ok(Array.isArray(css[relatedProperty]))

							if (!foundRelatedProperties.has(relatedProperty)) {
								css[property] = [...css[property], ...css[relatedProperty]]
								foundRelatedProperties.add(relatedProperty)
							}
						}

						css[property] = [...new Set(css[property])]
					}

					foundRelatedProperties.add(property)
				}
			}
		}

		// Sort css[property]
		for (const property of propertiesOrder) {
			assert.ok(Array.isArray(css[property]))

			// Initial alphabetical sort
			css[property].sort((a, b) => a.localeCompare(b))

			// Sort classnames according to `endSortOrder`
			{
				const sortedEndSortOrder: string[][] = Array.from(endSortOrder, () => [])
				const remainderClassnames: string[] = []

				for (const classname of css[property]) {
					const withoutPrefix = getClassnameParts(classname).withoutPrefix
					const index = endSortOrder.findIndex((current) => withoutPrefix.endsWith(current))

					if (Array.isArray(sortedEndSortOrder[index])) {
						sortedEndSortOrder[index].push(classname)
					}
					else {
						remainderClassnames.push(classname)
					}
				}

				// Sort `remainderClassnames` alphabetically
				remainderClassnames.sort((a, b) => {
					a = getClassnameParts(a).withoutPrefix
					b = getClassnameParts(b).withoutPrefix

					return (a.localeCompare(b))
				})

				// Flatten sorted classnames (endingGroupings)
				css[property] = [...new Set([
					...remainderClassnames,
					...sortedEndSortOrder.flat(Infinity) as string[],
				])]
			}

			// Sort classnames according to `separatorSortOrders`
			{
				const sortedSeparatorSortOrders: string[][] = []

				// Remaining (unsorted) classnames after each `separatorSortOrder` will be resorted according to subsequent `separatorSortOrders`
				let remainderClassnames: string[] = [...css[property]]

				for (const separatorSortOrder of separatorSortOrders) {
					if (remainderClassnames.length === 0) { break }

					const splitters = Array.isArray(separatorSortOrder.include)
						? separatorSortOrder.include
						: separatorSortOrder.regex

					// Check if any excluded
					if (Array.isArray(separatorSortOrder.exclude)) {
						const hasSomeExcluded = separatorSortOrder.exclude.some((current) => {
							assert.ok(Array.isArray(remainderClassnames))

							return remainderClassnames.some((classname) => {
								const withoutPrefix = getClassnameParts(classname).withoutPrefix

								return (
									(current.endsWith("-"))
										? withoutPrefix.includes(current)
										: withoutPrefix.endsWith(current)
								)
							})
						})

						if (hasSomeExcluded === true) { continue }
					}

					// Check if all included
					if (Array.isArray(separatorSortOrder.include)) {
						const hasEveryIncluded = separatorSortOrder.include.every((current) => {
							assert.ok(Array.isArray(remainderClassnames))

							return remainderClassnames.some((classname) => {
								const withoutPrefix = getClassnameParts(classname).withoutPrefix

								return (
									(current.endsWith("-"))
										? withoutPrefix.includes(current)
										: withoutPrefix.endsWith(current)
								)
							})
						})

						if (hasEveryIncluded === false) { continue }
					}

					// Get commonIdentifier
					let commonIdentifier = ""

					for (const classname of remainderClassnames) {
						const withoutPrefix = getClassnameParts(classname).withoutPrefix
						/* eslint-disable @stylistic/function-paren-newline */
						const splits = [...new Set(
							splitters
								.filter((splitter) => withoutPrefix.includes(splitter))
								.map((splitter) => withoutPrefix.split(splitter).at(0)!),
						)]
						/* eslint-enable @stylistic/function-paren-newline */

						for (const split of splits) {
							if (commonIdentifier.length < split.length) {
								commonIdentifier = split
							}
						}
					}

					const sortedSeparatorSortOrder: string[][] = Array.from(separatorSortOrder.regex, () => [])
					const remainderSeparatorSortOrder: string[] = []

					// Sort on `remainderClassnames`
					for (const classname of remainderClassnames) {
						const withoutPrefix = getClassnameParts(classname).withoutPrefix
						const index = separatorSortOrder.regex.findIndex((current) => {
							return (
								current.endsWith("-")
									? withoutPrefix.startsWith(`${ commonIdentifier }${ current }`)
									: withoutPrefix === `${ commonIdentifier }${ current }`)
						})

						if (Array.isArray(sortedSeparatorSortOrder[index])) {
							sortedSeparatorSortOrder[index].push(classname)
						}
						else {
							remainderSeparatorSortOrder.push(classname)
						}
					}

					// Append sorted to `sortedSeparatorSortOrders`
					sortedSeparatorSortOrders.push(sortedSeparatorSortOrder.flat(Infinity) as string[])

					// Reset `remainderClassnames`
					remainderClassnames = remainderSeparatorSortOrder
				}

				// Commit sorting changes
				css[property] = [...new Set([
					...remainderClassnames,
					...sortedSeparatorSortOrders.flat(Infinity) as string[],
				])] as NonEmptyArray<string>
			}

			// Sort classnames according to alphabetical groupname order and prefix
			{
				const classnamesParts = css[property].map((current) => {
					const { prefix, withoutPrefix } = getClassnameParts(current)
					const groupname = withoutPrefix.split("-").at(0)!

					return ({ classname: current, groupname, prefix })
				})
				const order = [...new Set(classnamesParts.map((current) => current.groupname))].toSorted((a, b) => a.localeCompare(b))
				const sortedClassnamesParts: Array<typeof classnamesParts> = Array.from(order, () => [])

				// Sort by alphabetical groupname order
				for (const classnameParts of classnamesParts) {
					sortedClassnamesParts[order.indexOf(classnameParts.groupname)]!.push(classnameParts)
				}

				// Sort by prefix
				for (const index of sortedClassnamesParts.keys()) {
					assert.ok(Array.isArray(sortedClassnamesParts[index]))

					if (sortedClassnamesParts[index].some((current) => current.prefix !== "")) {
						const sortedPrefixOrders: Array<typeof classnamesParts> = Array.from(classnamePrefixes, () => [])
						const remainderClassnames: typeof classnamesParts = []

						for (const sortedClassnameParts of sortedClassnamesParts[index]) {
							if (classnamePrefixes.includes(sortedClassnameParts.prefix)) {
								sortedPrefixOrders[classnamePrefixes.indexOf(sortedClassnameParts.prefix)]!.push(sortedClassnameParts)
							}
							else {
								remainderClassnames.push(sortedClassnameParts)
							}
						}

						// `min` || `max` prefixes are sorted to the end
						const hasMinMax = sortedPrefixOrders
							.some((sortedPrefixOrder) => {
								return sortedPrefixOrder
									.some((current) => {
										return ["min", "max"].includes(current.prefix)
									})
							})

						if (hasMinMax) {
							const withoutMinMax = sortedPrefixOrders
								.filter((sortedPrefixOrder) => {
									return sortedPrefixOrder
										.some((current) => {
											return !["min", "max"].includes(current.prefix)
										})
								})
							const withMinMax = sortedPrefixOrders
								.filter((sortedPrefixOrder) => {
									return sortedPrefixOrder
										.some((current) => {
											return ["min", "max"].includes(current.prefix)
										})
								})

							sortedClassnamesParts[index] = [...withoutMinMax.flat(), ...remainderClassnames, ...withMinMax.flat()]
						}
						else {
							sortedClassnamesParts[index] = [...sortedPrefixOrders.flat(), ...remainderClassnames]
						}
					}
				}

				css[property] = sortedClassnamesParts.flat().map((current) => current.classname)
			}
		}

		// Find properties with multiple groupnames
		/* eslint-disable @stylistic/no-tabs */
		/*
		{
			const propertiesWithMultipleGroupnames: string[] = []

			for (const property of propertiesOrder) {
				assert.ok(Array.isArray(css[property]))

				const propertyWithMultipleGroupnames = new Set<string>(css[property].map((current) => getClassnameParts(current).withoutPrefix.split("-").at(0)!))

				if (propertyWithMultipleGroupnames.size > 1) {
					propertiesWithMultipleGroupnames.push(property)
				}
			}

			// Print only property keys
			console.log("properties_with_multiple_groupnames:", JSON.stringify(propertiesWithMultipleGroupnames, undefined, ""))

			// Print with classnames
			// console.log("\nproperties_with_multiple_groupnames:")
			// console.log(JSON.stringify(propertiesWithMultipleGroupnames.reduce<Record<string, string[]>>((accumulator, current) => {
			// 	accumulator[current] = css[current]!

			// 	return accumulator
			// }, {}), undefined, ""))
			// console.log()
		}
		/* */
		/* eslint-enable @stylistic/no-tabs */

		// Flatten css properties into single array
		/* eslint-disable @stylistic/function-paren-newline */
		classnames = [...new Set(
			Object.keys(css)
				.map((current) => css[current])
				.flat(Infinity) as string[],
		)] as unknown as NonEmptyArray<string>
		/* eslint-enable @stylistic/function-paren-newline */
	}

	// Group different but related classnames (eg `.from`, `.via`, `.to`)
	for (const groupnameSortOrder of groupnameSortOrders) {
		const groupnames = classnames.map<string>((current) => getClassnameParts(current).withoutPrefix.split("-").at(0)!)

		const found: string[][] = Array.from(groupnameSortOrder, () => [])
		const firstIndex = Math.min(...groupnameSortOrder.map((current) => groupnames.indexOf(current)))

		for (const [index, groupname] of groupnames.entries()) {
			if (groupnameSortOrder.includes(groupname)) {
				found[groupnameSortOrder.indexOf(groupname)]!.push(classnames.at(index)!)
			}
		}

		classnames = [...new Set([
			...classnames.slice(0, firstIndex),
			...found.flat(Infinity),
			...classnames.slice(firstIndex),
		])] as unknown as NonEmptyArray<string>
	}

	// Convert to `OrderData` format
	for (const classname of classnames) {
		const groupname: string = getClassnameParts(classname)
			.withoutPrefix
			.split("-")
			.at(0)!

		// Group similar classnames for quicker matches using list of lists
		switch (groupname) {
			case orderDatas?.at(-1)?.group_name: {
				orderDatas.at(-1)!.regex.push(classname)

				break
			}

			default: {
				orderDatas.push({ group_name: groupname, regex: [classname] })
			}
		}
	}

	// Reorder defaultStyleOrder
	{
		orderDatas = reorderMoveToTop(
			[
				{ group_name: "dark", regex: ["dark"] },
				{ group_name: "group", regex: ["group", r`group/[\dA-Za-z]{1,}`] },
				{ group_name: "peer", regex: ["peer", r`peer/[\dA-Za-z]{1,}`] },
				{ group_name: "@container", regex: ["@container", "@container-normal", r`@container/[\dA-Za-z]{1,}`] }, // `.@container\/\[\\dA-Za-z\]` to be added back in generate-order-list.ts as `@container/[\dA-Za-z]` (see prepare-css.ts)
				{ group_name: "prose", regex: ["not-prose", "prose", "prose-invert"] },
				...orderDatas,
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
		orderDatas = reorderMoveToGroupname(orderDatas, [
			{ groupname: "static", include: "static" },
			{ groupname: "absolute", include: "absolute" },
			{ groupname: "relative", include: "relative" },
			{ groupname: "fixed", include: "fixed" },
			{ groupname: "sticky", include: "sticky" },
		])
		// Reorder positionXYOrder
		orderDatas = reorderMoveToGroupname(orderDatas, [
			{ groupname: "inset", include: "inset-auto" },
			{ groupname: "top", include: "top-auto" },
			{ groupname: "right", include: "right-auto" },
			{ groupname: "bottom", include: "bottom-auto" },
			{ groupname: "left", include: "left-auto" },
			{ groupname: "z", include: "z-auto" },
		])
		// Reorder displayStyleOrder
		orderDatas = reorderMoveToGroupname(orderDatas, [
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
		orderDatas = reorderMoveToGroupname(orderDatas, [
			{ groupname: "container", include: "container" },
			{ groupname: "size", include: "size-auto" },
			{ groupname: "w", include: "w-auto" },
			{ groupname: "h", include: "h-auto" },
		])
	}

	return ({ order: orderDatas })
}

function getClassnameParts (classname: string): { withoutNegative: string, withoutPrefix: string, prefix: string } {
	const withoutNegative = classname.replace(/^-\{0,1\}/, "")
	const prefix = classnamePrefixes.includes(withoutNegative.slice(0, withoutNegative.indexOf("-")))
		? withoutNegative.slice(0, withoutNegative.indexOf("-"))
		: ""
	const withoutPrefix = (prefix === "")
		? withoutNegative
		: withoutNegative.slice(withoutNegative.indexOf("-") + 1)

	return ({ withoutNegative, withoutPrefix, prefix })
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
	const remainderGroupnames = orderDataArray
		.filter((_, index) => !orderedIndices.has(index))

	return [...orderedGroupnames, ...remainderGroupnames]
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
