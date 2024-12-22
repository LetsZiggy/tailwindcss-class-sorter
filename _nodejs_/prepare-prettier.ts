/* eslint-disable @stylistic/function-paren-newline */

import { readFile, writeFile } from "node:fs/promises"
// import tailwindColours from "tailwindcss/colors.js" // POSSIBLY NOT NEEDED
import tailwindColours from "tailwindcss/colors.js"
import { getArgv } from "./helper.js"

/** @type { RegExp } */
const colourMonoList = "(?:" + (["inherit", "transparent", "current", "black", "white"]
	.map((current) => `(?:${ current })`)
	.join("|")) + ")"

/** @type { RegExp } */
const colourShadeList = "(?:" + (Object.keys(tailwindColours)
	.filter((current) => !["inherit", "transparent", "current", "black", "white"].includes(current))
	.sort((a, b) => (a.length < b.length) ? 1 : -1)
	.map((current) => current.toLowerCase())
	.map((current) => `(?:${ current })`)
	.join("|")) + ")"

/** @type { RegExp } */
const monoDigit = new RegExp(String.raw`${ colourMonoList }-\d+\n`, "g")

/** @type { RegExp } */
const shadeDigit = new RegExp(String.raw`${ colourShadeList }-\d+\n`, "g")

/** @type { RegExp } */
const monoSlashDigit = new RegExp(String.raw`${ colourMonoList }/\d+\n`, "g")

/** @type { RegExp } */
const shadeSlashDigit = new RegExp(String.raw`${ colourShadeList }/\d+\n`, "g")

/** @type { RegExp } */
const monoDigitSlashDigit = new RegExp(String.raw`${ colourMonoList }-\d+/\d+\n`, "g")

/** @type { RegExp } */
const shadeDigitSlashDigit = new RegExp(String.raw`${ colourShadeList }-\d+/\d+\n`, "g")

await (async function () {
	console.time("prepare prettier")

	const html: string = await readFile(getArgv("--in"), { encoding: "utf8", flag: "r" })
		.then((string_: string) => string_
			/* --- */
			.replaceAll(/(?<!(?:;\s)|,|(?:\/\*!\*\/\s))\/\*[\s\w!"#'()*,./:<=>?`|-]+\*\//g, "") // Removes outer comments (leaves comments in styles alone)
			.replaceAll("{\n", "{ ") // Removes newline after "{"
			.replaceAll("\n}", " }") // Removes newline before "}"
			.replaceAll(/(;|:|,|\*\/)\s+/g, "$1 ") // Removes newline after ; | : | , | */ (end of comment in styles)
			.replaceAll(/[\t ]+/g, " ") // Trims spaces
			.replaceAll(/\n+/g, "\n") // Trims newlines
			.replaceAll(/,(\.[\dA-Za-z])/g, ", $1") // Add a space between merged classes
			.replaceAll(/(^[^.][^\n]+)|(\n[^.][^\n]+)/g, "") // Removes non-tailwindcss styles
			.replaceAll(/^\n/g, "") // Removes empty lines
			.replaceAll(/^\n\n+/g, "\n"), // Removes empty lines
		)
		.then((string_: string) => string_
			.replaceAll((/, ?\./g), "\n.") // Split merged classes
			.replaceAll((/(\.[\w\\./@%-]+)(?:(?::{1,2}[^}]+})|(?: >[^}]+})|(?: [^}]+}))/g), "$1") // Extract classes
			.replaceAll((/\\([./%@])/g), "$1") // Removes escape slashes
			.replaceAll((/\.([\w\\./@%-]+)/g), "$1") // Removes dots
			.replaceAll((/\n*$/g), ""), // Removes empty lines
		)
		.then((string_: string) => string_
			.replaceAll(/-\d+xs\n/g, "-2xs\n") // dash digit xs to -2xs
			.replaceAll(/-\d+xl\n/g, "-2xl\n") // dash digit xl to -2xl
			.replaceAll(/-\d+\n/g, "-5\n") // dash digit to -5
			.replaceAll(/-\d+\.\d+\n/g, "-0.5\n") // dash decimal to 0.5
			.replaceAll(/-\d+\/\d+\n/g, "-1/2\n") // dash digit slash digit to -1/2
			.replaceAll(/-\d+%\n/g, "-0%\n") // dash percentage to -0%
			.replaceAll(new RegExp(`-(${ colourMonoList })`, "g"), "-black")
			.replaceAll(new RegExp(`-(${ colourShadeList })`, "g"), "-neutral")
			.replaceAll(monoDigit, "black-50\n")
			.replaceAll(shadeDigit, "neutral-50\n")
			.replaceAll(monoSlashDigit, "black/10\n")
			.replaceAll(shadeSlashDigit, "neutral/10\n")
			.replaceAll(monoDigitSlashDigit, "black-100/10\n")
			.replaceAll(shadeDigitSlashDigit, "neutral-100/10\n"),
		)
		.then((string_: string) => [...new Set(string_.split("\n"))])
		// .then((array: string[]) => array.join("\n"))
		.then((array: string[]) => `<!doctype html>\n<html>\n<body>\n<div class="${ array.join(" ") }"></div>\n</body>\n</html>\n`)
		/*
		.then((array: string[]) => {
			const length = array.length
			const divs: string[] = []
			const limits: Array<[number, number]> = []
			let count = 0

			while (count < length) {
				const lastIndex = count + 125

				limits.push([count, Math.min(lastIndex, length)])
				count = lastIndex
			}

			for (const limit of limits) {
				divs.push(`<div class="${ array.slice(limit[0], limit[1]).join(" ") }"></div>\n`)
			}

			return `<!doctype html>\n<html>\n<body>\n${ divs.join("") }</body>\n</html>\n`
		})
		/* */
		.catch((error: Error) => {
			throw new Error(`${ error.name }: ${ error.message }`)
		})

	await writeFile(getArgv("--out"), html, { encoding: "utf8", flag: "w" })

	console.timeEnd("prepare prettier")
})()
