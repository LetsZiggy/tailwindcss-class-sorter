/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

import aspectRatioPlugin from "@tailwindcss/aspect-ratio"
import containerQueriesPlugin from "@tailwindcss/container-queries"
import formsPlugin from "@tailwindcss/forms"
import typographyPlugin from "@tailwindcss/typography"
import tailwindColours from "tailwindcss/colors.js"
import stub from "tailwindcss/stubs/config.full.js"

/** @typedef { import("type-fest").RequiredDeep<import("tailwindcss").Config> } Config */

/** @type { RegExp } */
const colourMonoList = new RegExp(["inherit", "transparent", "current", "black", "white"]
	.map((current) => `(?:${ current })`)
	.join("|"))

/** @type { RegExp } */
const colourShadeList = new RegExp(Object.keys(tailwindColours)
	.filter((current) => !["inherit", "transparent", "current", "black", "white"].includes(current))
	.sort((a, b) => (a.length < b.length) ? 1 : -1)
	.map((current) => current.toLowerCase())
	.map((current) => `(?:${ current })`)
	.join("|"))

/**
 * @param { import("type-fest").PartialDeep<Config["theme"]> } theme
 * @returns { Config["Theme"] }
 */
function trimTheme (theme = stub.theme) {
	/** @type { Record<string | number, any> } */
	const updated = {}

	for (const corePluginsKey of Object.keys(theme)) {
		let hasNumber = false
		let hasDecimal = false
		let hasFraction = false
		let hasXs = false
		let hasXl = false
		let hasColourMono = false
		let hasColourShade = false

		updated[corePluginsKey] = (typeof theme[corePluginsKey] === "function")
			? theme[corePluginsKey]
			: {}

		if (typeof theme[corePluginsKey] !== "function") {
			/** @type { Array<string | number> } */
			const propertyKeys = Object.keys(theme[corePluginsKey])
					.reduce((/** @type { Array<string | number> } */ accumulator, current) => {
						if ((/\d+/).test(`${ current.trim() }`) && !hasNumber) {
							hasNumber = true
							accumulator.push(current)
						}
						else if ((/\d+\.\d+/).test(`${ current.trim() }`)) {
							if (!hasDecimal) {
								hasDecimal = true
								accumulator.push(current)
							}
						}
						else if ((/\d+\/\d+/).test(`${ current.trim() }`)) {
							if (!hasFraction) {
								hasFraction = true
								accumulator.push(current)
							}
						}
						else if ((/\d+[xX][sS]/).test(`${ current.trim() }`)) {
							if (!hasXs) {
								hasXs = true
								accumulator.push(current)
							}
						}
						else if ((/\d+[xX][lL]/).test(`${ current.trim() }`)) {
							if (!hasXl) {
								hasXl = true
								accumulator.push(current)
							}
						}
						else if (colourMonoList.test(`${ current.trim() }`)) {
							if (!hasColourMono) {
								hasColourMono = true
								accumulator.push(current)
							}
						}
						else if (colourShadeList.test(`${ current.trim() }`)) {
							if (!hasColourShade) {
								hasColourShade = true
								accumulator.push(current)
							}
						}
						else {
							accumulator.push(current)
						}

						return accumulator
					}, [])

			for (const propertyKey of propertyKeys) {
				updated[corePluginsKey][propertyKey] = theme[corePluginsKey][propertyKey]
			}
		}
	}

	return updated
}

/** @type { Config } */
// @ts-expect-error: containerQueriesPlugin type not matching plugins type
export default {
	content: ["content.html"],
	safelist: [{ pattern: /.+/ }],
	presets: [],
	darkMode: "media", // "media" | "class"
	// theme: trimTheme(stub.theme),
	/* */
	theme: {
		...trimTheme(stub.theme),
		// https://github.com/tailwindlabs/tailwindcss-aspect-ratio?tab=readme-ov-file#compatibility-with-default-aspect-ratio-utilities
		aspectRatio: {
			auto: "auto",
			square: "1 / 1",
			video: "16 / 9",
			0: "0",
		},
	},
	/* */
	// corePlugins: [],
	plugins: [
		aspectRatioPlugin,
		formsPlugin({ strategy: "class" }),
		containerQueriesPlugin,
		typographyPlugin,
	],
}
