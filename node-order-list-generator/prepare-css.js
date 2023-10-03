/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-var-requires, @stylistic/function-paren-newline, unicorn/prefer-top-level-await */

const { readFile, writeFile } = require("node:fs/promises")
// const colors = require("tailwindcss/colors") // POSSIBLY NOT NEEDED
const { getArgv } = require("./helper")

/*
const colorStr = Object.keys(colors)
	.map((curr) => curr.toLowerCase())
	.join("|") // POSSIBLY NOT NEEDED
*/

;(async function () {
	console.time("prepare style.css")

	const css = await readFile(getArgv("--src"), { encoding: "utf8", flag: "r" })
		.then((string_) =>
			 string_
				.replaceAll(/(?<!(?:;\s)|,|(?:\/\*!\*\/\s))\/\*[\s\w!"#'()*,./:<=>?`|-]+\*\//g, "") // Remove outer comments (leaves comments in styles alone)
				.replaceAll("{\n", "{ ") // Removes newline after "{"
				.replaceAll("\n}", " }") // Removes newline before "}"
				.replaceAll(/(;|:|,|\*\/)\s+/g, "$1 ") // Removes newline after ; | : | , | */ (end of comment in styles)
				.replaceAll(/[\t ]+/g, " ") // Trims spaces
				.replaceAll(/\n+/g, "\n"), // Trims newlines
		)
		.then((string_) =>
			 string_
				.replaceAll(/(?<=\d|[a-z]):{1,2}[a-z-]+(?=,|(?:\s{))/g, "") // Removes vendor-prefixes
				.replaceAll(/(?<=\s)((?:-?\d+\.\d+)|(?:-?\.?\d+))(?=((?:\s\d+)|(?:\sauto)|(?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%|(?:\s-)|(?:\s\/)|;))/g, "0") // Convert integer/float css values to `0`
				.replaceAll(/(?<=\() ?((?:-?\d+\.\d+)|(?:-?\.?\d+))(?=((?:\s\d+)|(?:\sauto)|(?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%|(?:\s-))?([\s),]))/g, "0") // Convert all single args integer/float to `0`
				.replaceAll(/(?<=\() ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+)(?=\)|,)/g, "0,0,0") // Convert all triple args integer/float to `0,0,0`
				.replaceAll(/(?<=\() ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+), ?((?:\d+\.\d+)|\d+)(?= ?\)|,)/g, "0,0,0,0") // Convert all quadruple args integer/float to `0,0,0,0`
				.replaceAll(/(?<=\s|\(|,|:)((?:\d+\.\d+)|\d+)((?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%)(?=\s|\)|,|;)/g, "0") // Remove all value units
				.replaceAll(/(?<=#)\w{3,6}(?=\s|\)|,|;)/g, "000") // Convert all hex to `000`
				.replaceAll(/(?<=-)\d+(?=(?:xl)|:|(?:\s>)|(?:\s{))/g, "0") // Convert classes ending with number to `0`
				.replaceAll(/(?<=-[A-Za-z]+)\\\/\d+(?=(?:xl)|:|(?:\s>)|(?:\s{))/g, "\\/5") // Convert classes ending with fraction to `0\/5`
				.replaceAll(/(?<=-)\d+\\\/\d+(?=(?:xl)|:|(?:\s>)|(?:\s{))/g, "0\\/5") // Convert classes ending with fraction to `0\/5`
				.replaceAll(/(?<=-)\d+\\\.\d+(?=(?:xl)|:|(?:\s>)|(?:\s{))/g, "0\\.5") // Convert classes ending with float to `0\.5`
				.replaceAll(/rgb\((?:\d+ ){3}\/ (?:(?:\d{1,4}\.?\d{0,4})|[\d()a-z-]+)\)/g, "rgb(0 0 0 / 0)") // Convert rgb() to `rgb(0 0 0 / 0)`
				// .replaceAll(new RegExp(`(${ colorStr })`, "gi"), (string) => string.toLowerCase()) // Lowercase all colour classes - POSSIBLY NOT NEEDED
				.replaceAll(/(?<=\.w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "width: 0;") // Convert `w-(min|max|fit)` classes styles to `width: 0;`
				.replaceAll(/(?<=\.min-w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "min-width: 0;") // Convert `min-w-(min|max|fit)` classes styles to `min-width: 0;`
				.replaceAll(/(?<=\.max-w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "max-width: 0;") // Convert `max-w-(min|max|fit)` classes styles to `max-width: 0;`
				.replaceAll(/(?<=\.h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "height: 0;") // Convert `h-(min|max|fit)` classes styles to `height: 0;`
				.replaceAll(/(?<=\.min-h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "min-height: 0;") // Convert `min-h-(min|max|fit)` classes styles to `min-height: 0;`
				.replaceAll(/(?<=\.max-h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(?=\s})/g, "max-height: 0;") // Convert `max-h-(min|max|fit)` classes styles to `max-height: 0;`
				.replaceAll(/(?<=\.-?inset-[\d./\\a-z-]+\s{\s)[^}]+(?=\s})/g, "inset: 0;") // Convert all inset classes styles to `inset: 0;`
				.replaceAll(/(?<=\.-?m[xy]-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "margin: 0;") // Convert all `mx|my` classes styles to `margin: 0;`
				.replaceAll(/(?<=\.-?space-[xy]-[\d./\\a-z]+\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(?=\s})/g, "margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;") // Convert all space classes styles to `margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;`
				.replaceAll(/(?<=\.p[xy]-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "padding: 0;") // Convert all `px|py` classes styles to `padding: 0;`
				.replaceAll(/(?<=\.border-opacity-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "border-color: rgba(0,0,0,0);") // Convert all border-opacity classes styles to `border-color: rgba(0,0,0,0);`
				.replaceAll(/(?<=\.divide-[xy](?:-[\da-z]+)?\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(?=\s})/g, "border-width: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0;") // Convert all divide classes styles to `border-width: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0;`
				.replaceAll(/(?<=\.divide-opacity-[\d./\\a-z]+\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(?=\s})/g, "border-color: rgba(0,0,0,0);") // Convert all divide-opacity classes styles to `border-color: rgba(0,0,0,0);`
				.replaceAll(/(?<=\.bg-opacity-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "background-color: rgba(0,0,0,0);") // Convert all bg-opacity classes styles to `background-color: rgba(0,0,0,0);`
				.replaceAll(/(?<=\.text-opacity-[\d./\\a-z]+\s{\s)[^}]+(?=\s})/g, "color: rgba(0,0,0,0);"), // Convert all text-opacity classes styles to `color: rgba(0,0,0,0);`
		)
		.then((string_) => string_.split("\n"))
		.then((array) => array.filter((line) => line.startsWith("."))) // Removes all non-class styles
		/*
		.then((arr) => arr.reduce((acc, line) => {
			if (line.search(/\.\w[\w./\\\-]+, \.\w[\w./\\\-]+/) > -1) {
				const classes = line
					.split(" {")[0] // Get only classes
					.split(", ") // Split classes
				const styles = `{ ${ line.split(" { ")[1] }`

				line = classes.reduce(
					(strAcc, className) =>
						`${ strAcc }${ strAcc.length > 0 ? "\n" : "" }${ className } ${ styles }`,
					"",
				)
			}

			return [ ...acc, line ]
		}, [])) // Ensure one class per line (Duplicate and split multiple classes) - POSSIBLY NOT NEEDED
		*/
		.then((array) => [ ...new Set(array) ]) // Remove duplicate classes and styles
		.then((array) => array.join("\n"))
		.catch((error) => { console.log(`${ error.name }: ${ error.message }`) })
		?? undefined

	writeFile(getArgv("--src"), `${ css }\n`, { encoding: "utf8", flag: "w" })

	console.timeEnd("prepare style.css")
})()
