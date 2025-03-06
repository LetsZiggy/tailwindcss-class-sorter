// pnpm run transpile && pnpm run prepare:css

import { type FileHandle, open, writeFile } from "node:fs/promises"
// import defaults from "./defaults-list.json" with { type: "json" } // POSSIBLY NOT NEEDED
import defaults from "./defaults-list.json" with { type: "json" }
import { getArgv } from "./helper.js"

/*
const colorString = [...defaults["colour-absolute"], ...defaults["colour-relative"]]
	.map((current) => current.toLowerCase())
	.join("|") // POSSIBLY NOT NEEDED
*/

await (async function () {
	console.time("prepare style.css")

	// const css: string = await readFile(getArgv("--in"), { encoding: "utf8", flag: "r" })
	// 	.then((string_: string) => string_
	// 		/* --- */
	// 		.replaceAll(/(?<!(?:;\s)|,|(?:\/\*!\*\/\s))\/\*[\s\w!"#'()*,./:<=>?`|-]+\*\//g, "") // Removes outer comments (leaves comments in styles alone)
	// 		.replaceAll("{\n", "{ ") // Removes newline after "{"
	// 		.replaceAll("\n}", " }") // Removes newline before "}"
	// 		.replaceAll(/(;|:|,|\*\/)\s+/g, "$1 ") // Removes newline after ; | : | , | */ (end of comment in styles)
	// 		.replaceAll(/[\t ]+/g, " ") // Trims spaces
	// 		.replaceAll(/\n+/g, "\n") // Trims newlines
	// 		.replaceAll(/,(\.[\dA-Za-z])/g, ", $1") // Add a space between merged classes
	// 		.replaceAll(/(^[^.][^\n]+)|(\n[^.][^\n]+)/g, "") // Removes non-tailwindcss styles
	// 		.replaceAll(/^\n/g, "") // Removes empty lines
	// 		.replaceAll(/^\n\n+/g, "\n"), // Removes empty lines
	// 	)
	// 	.then((string_: string) => string_
	// 		/* --- */
	// 		.replaceAll(/(?<=\d|[a-z]):{1,2}[a-z-]+(?=,|(?:\s{))/g, "") // Removes vendor-prefixes
	// 		.replaceAll(/(?<=\s)((?:-?\d+\.\d+)|(?:-?\.?\d+))(?=((?:\s\d+)|(?:\sauto)|(?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%|(?:\s-)|(?:\s\/)|;))/g, "0") // Convert integer/float css values to `0`
	// 		.replaceAll(/(?<=\() ?((?:-?\d+\.\d+)|(?:-?\.?\d+))(?=((?:\s\d+)|(?:\sauto)|(?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%|(?:\s-))?([\s),]))/g, "0") // Convert all single args integer/float to `0`
	// 		.replaceAll(/(?<=\() ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+)(?=\)|,)/g, "0,0,0") // Convert all triple args integer/float to `0,0,0`
	// 		.replaceAll(/(?<=\() ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+)(?= ?\)|,)/g, "0,0,0,0") // Convert all quadruple args integer/float to `0,0,0,0`
	// 		.replaceAll(/(?<=\s|\(|,|:)((?:\d+\.\d+)|\d+)((?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%)(?=\s|\)|,|;)/g, "0") // Removes all value units
	// 		.replaceAll(/(?<=#)\w{3,6}(?=\s|\)|,|;)/g, "000") // Convert all hex to `000`
	// 		.replaceAll(/(?<=-)\d+(?=(?:xl)|:|(?:\s>)|(?:\s{))/g, "0") // Convert classes ending with number to `0`
	// 		.replaceAll(/(?<=-[A-Za-z]+)\\\/\d+(?=(?:xl)|:|(?:\s>)|(?:\s{))/g, String.raw`\/5`) // Convert classes ending with fraction to `0\/5`
	// 		.replaceAll(/(?<=-)\d+\\\/\d+(?=(?:xl)|:|(?:\s>)|(?:\s{))/g, String.raw`0\/5`) // Convert classes ending with fraction to `0\/5`
	// 		.replaceAll(/(?<=-)\d+\\\.\d+(?=(?:xl)|:|(?:\s>)|(?:\s{))/g, String.raw`0\.5`) // Convert classes ending with float to `0\.5`
	// 		.replaceAll(/rgb\((?:\d+ ){3}\/ (?:(?:\d{1,4}\.?\d{0,4})|[\d()a-z-]+)\)/g, "rgb(0 0 0 / 0)") // Convert rgb() to `rgb(0 0 0 / 0)`
	// 		// .replaceAll(new RegExp(`(${ colorString })`, "gi"), (string) => string.toLowerCase()) // Lowercase all colour classes - POSSIBLY NOT NEEDED

	// 		/* --- */
	// 		.replaceAll(/(?<= )--tw-scroll-snap-strictness: [^;]+?;/g, "scroll-snap-type: none;") // Convert .snap-\w+ classes styles
	// 		.replaceAll(/(?<= )--tw-placeholder-opacity: [^;]+?;/g, "color: #000;") // Convert --tw-placeholder-opacity var to color
	// 		.replaceAll(/(?<= )--tw-shadow: [^;]+?;/g, "box-shadow: #000;") // Convert --tw-shadow var to box-shadow
	// 		.replaceAll(/(?<= )--tw-gradient-(?:(?:to)|(?:from)|(?:stops)|(?:to-position)|(?:from-position)|(?:via-position)): [^;]+?;/g, "background-image: unset;") // Convert --tw-gradient-(to|from|stops|to-position|from-position|via-position) var to background-image
	// 		.replaceAll(/(?<= )--tw-ring-(?:(?:inset)|(?:color)|(?:opacity)|(?:offset-color)|(?:offset-width)): [^;]+?;/g, "box-shadow: #000;") // Convert --tw-ring-(inset|color|opacity|offset-color|offset-width) var to box-shadow
	// 		.replaceAll(/(?<=\.text-opacity\s{\s)[^}](?=\s})/g, "color: #000;") // Convert .text-opacity classes styles
	// 		.replaceAll(/(?<=\.w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "width: 0;") // Convert `w-(min|max|fit)` classes styles to `width: 0;`
	// 		.replaceAll(/(?<=\.min-w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "min-width: 0;") // Convert `min-w-(min|max|fit)` classes styles to `min-width: 0;`
	// 		.replaceAll(/(?<=\.max-w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "max-width: 0;") // Convert `max-w-(min|max|fit)` classes styles to `max-width: 0;`
	// 		.replaceAll(/(?<=\.h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "height: 0;") // Convert `h-(min|max|fit)` classes styles to `height: 0;`
	// 		.replaceAll(/(?<=\.min-h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "min-height: 0;") // Convert `min-h-(min|max|fit)` classes styles to `min-height: 0;`
	// 		.replaceAll(/(?<=\.max-h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "max-height: 0;") // Convert `max-h-(min|max|fit)` classes styles to `max-height: 0;`
	// 		.replaceAll(/(?<=\.-?inset-[\d./\\a-z-]+\s{\s)[^}]+(?=\s})/g, "inset: 0;") // Convert all inset classes styles to `inset: 0;`
	// 		.replaceAll(/(?<=\.-?m[xy]-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "margin: 0;") // Convert all `mx|my` classes styles to `margin: 0;`
	// 		.replaceAll(/(?<=\.-?space-[xy]-[\d./\\a-z]+\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(?=\s})/g, "margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;") // Convert all space classes styles to `margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;`
	// 		.replaceAll(/(?<=\.p[xy]-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "padding: 0;") // Convert all `px|py` classes styles to `padding: 0;`
	// 		.replaceAll(/(?<=\.border-opacity-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "border-color: rgba(0,0,0,0);") // Convert all border-opacity classes styles to `border-color: rgba(0,0,0,0);`
	// 		.replaceAll(/(?<=\.divide-[xy](?:-[\da-z]+)?\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(?=\s})/g, "border-width: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0;") // Convert all divide classes styles to `border-width: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0;`
	// 		.replaceAll(/(?<=\.divide-opacity-[\d./\\a-z]+\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(?=\s})/g, "border-color: rgba(0,0,0,0);") // Convert all divide-opacity classes styles to `border-color: rgba(0,0,0,0);`
	// 		.replaceAll(/(?<=\.bg-opacity-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "background-color: rgba(0,0,0,0);") // Convert all bg-opacity classes styles to `background-color: rgba(0,0,0,0);`
	// 		.replaceAll(/(?<=\.text-opacity-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "color: rgba(0,0,0,0);") // Convert all text-opacity classes styles to `color: rgba(0,0,0,0);`
	// 		.replaceAll(/(?<=\.text-opacity-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "color: rgba(0,0,0,0);") // Convert all text-opacity classes styles to `color: rgba(0,0,0,0);`

	// 		/* --- */
	// 		.replaceAll(/ --tw[^;]+?;/g, "") // Removes tailwindcss custom properties
	// 		.replaceAll(/\(--tw[^)]+?\)/g, "(--tmp)") // Removes tailwindcss custom properties
	// 		.replaceAll(/ > [^{]+{/g, " {") // Removes siblings selector
	// 		.replaceAll(/(\.[\dA-Za-z-]+?):[^,]+?, ?\./g, "$1, .") // Removes pseudo-class
	// 		.replaceAll(/(\.[\dA-Za-z-]+?):[^{]+? ?{/g, "$1 {"), // Removes pseudo-class
	// 	)
	// 	/* */
	// 	.then((string_: string) => string_
	// 		.replaceAll(/:where[^{]+/g, " ")
	// 		.replaceAll("  ", " ")
	// 		.replaceAll(/(\.prose-[\dA-Za-z]+?) {[^}]+}/g, "$1 { color: #000; opacity: 0; }"),
	// 	) // Handle .prose classes
	// 	/* */
	// 	/* */
	// 	.then((string_: string) => string_
	// 		.replaceAll(/(\.aspect[^ ]+ {) ([^a}])/g, "$1 aspect-ratio: auto; $2")
	// 		.replaceAll(/(\.aspect[^ ]+) { }/g, "$1 { aspect-ratio: auto; position: relative; }"),
	// 	) // Handle .aspect classes
	// 	/* */
	// 	/* */
	// 	.then((string_: string) => string_
	// 		.replaceAll(String.raw`.\@`, ".@"), // Convert all .\\@container to .@container
	// 	) // Handle .@container classes
	// 	/* */
	// 	.then((string_: string) => string_.split("\n"))
	// 	.then((array: string[]) => array.filter((line) => line.startsWith("."))) // Removes all non-class styles
	// 	/* */
	// 	.then((array: string[]) => array.reduce((accumulator: string[], line: string) => {
	// 		if (line.search(/\.\w[\w./\\-]+, \.\w[\w./\\-]+/) > -1) {
	// 			const classes = line
	// 				.split(" {")[0]! // Get only classes
	// 				.split(", ") // Split classes
	// 			const styles = `{ ${ line.split(" { ")[1] }`

	// 			line = classes.reduce(
	// 				(stringAccumulator: string, className: string) => `${ stringAccumulator }${ stringAccumulator.length > 0 ? "\n" : "" }${ className } ${ styles }`,
	// 				"",
	// 			)
	// 		}

	// 		return [...accumulator, line]
	// 	}, [])) // Ensure one class per line (Duplicate and split multiple classes)
	// 	/* */
	// 	.then((array: string[]) => [...new Set(array)]) // Removes duplicate classes and styles
	// 	.then((array: string[]) => array.join("\n"))
	// 	.catch((error: Error) => {
	// 		throw new Error(`${ error.name }: ${ error.message }`)
	// 	})

	let isInUtilitiesLayer = false
	let isInClass = false
	let toSkipLine = 0
	let className = ""
	const properties = new Set<string>()
	const classes: string[] = []
	const cssFile: FileHandle = await open(getArgv("--in"), "r", 0o644)
	const units = (Object.keys(defaults) as Array<keyof typeof defaults>)
		.filter((key) => key.includes("-unit"))
		.map((key) => defaults[key].map((unit: string) => `(?:${ unit })`).join("|"))
		.join("|")

	for await (const line of cssFile.readLines({ encoding: "utf8" })) {
		if (line === "@layer utilities {") {
			isInUtilitiesLayer = true

			continue
		}

		if (isInUtilitiesLayer && line === "}") {
			isInUtilitiesLayer = false

			continue
		}

		if (isInUtilitiesLayer && !isInClass && line.startsWith("  .")) {
			isInClass = true
			className = `${ line.trim() } `

			continue
		}

		if (isInUtilitiesLayer && isInClass && line === "  }") {
			isInClass = false
			className += [...properties].join(" ")
			className += ` ${ line.trim() }`
			classes.push(className)
			className = ""
			properties.clear()

			continue
		}

		if (isInUtilitiesLayer && isInClass && (line.startsWith("    @media") || line.startsWith("      @media") || line.startsWith("    :where") || line.startsWith("    &:") || line.startsWith("      &:"))) {
			toSkipLine += 1

			continue
		}

		if (isInUtilitiesLayer && isInClass && toSkipLine > 0 && (line === "    }" || line === "      }")) {
			toSkipLine -= 1

			continue
		}

		if (isInUtilitiesLayer && isInClass) {
			let l: string = line.trim()

			// remove css custom properties
			if (l.search(/^--[^:]+:[^;]+;$/) !== -1) {
				continue
			}

			// replace quotes value to none
			l = l.replaceAll(new RegExp(`quotes: [^;]+;`, "g"), "quotes: none;")
			// replace url value to ""
			l = l.replaceAll(new RegExp(`url\\("[^"]+"\\)`, "g"), "url(\"\")")
			// replace custom property in var
			l = l.replaceAll(new RegExp(`var\\(--[^,\\)]+([,\\)])`, "g"), "var(--tmp$1")
			// replace oklch value to #000
			l = l.replaceAll(new RegExp(`oklch\\([^\\)]+\\)`, "g"), "#000")
			// replace css unit numeric value to 5
			l = l.replaceAll(new RegExp(`([ \\(])(-?)\\d+(?:\\.\\d+)?((?:%)|${ units })`, "g"), "$1$25$3")
			// replace numeric value to 5
			l = l.replaceAll(new RegExp(`([ \\(])(-?)\\d+(?:\\.\\d+)?`, "g"), "$1$25")
			// replace fraction value to 5
			l = l.replaceAll(new RegExp(`\\d+/\\d+`, "g"), "1/2")
			// replace color value #000
			l = l.replaceAll(new RegExp(`#[a-zA-Z0-9]+([ ;\\)])`, "g"), "#000$1")
			// replace content property to none
			l = l.replaceAll(new RegExp(`content: [^;]+([ ;\\)])`, "g"), "content: none$1")

			properties.add(l)
		}
	}

	await writeFile(getArgv("--out"), `${ classes.join("\n") }\n`, { encoding: "utf8", flag: "w" })

	console.timeEnd("prepare style.css")
})()
