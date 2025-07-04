import { type FileHandle, open, writeFile } from "node:fs/promises"
import defaults from "./defaults-list.json" with { type: "json" }
import { getArgv, sorting } from "./helper.js"

/*
const colorString = [...defaults["colour-absolute"], ...defaults["colour-relative"]]
	.map((current) => current.toLowerCase())
	.join("|") // POSSIBLY NOT NEEDED
*/

const units = (Object.keys(defaults) as Array<keyof typeof defaults>)
	.filter((key) => key.includes("-unit"))
	.map((key) => defaults[key].map((unit: string) => `(?:${ unit })`).join("|"))
	.join("|")

await (async function () {
	console.time("prepare style.css")

	const cssProperties = new Set<string>()
	const emptyClasses = new Map<string, string[]>()
	let classes: string[] = []
	let className = ""
	let isInClass = false
	let isInUtilitiesLayer = false
	let linesToSkip = 0

	// main loop
	const file: FileHandle = await open(getArgv("--in"), "r", 0o644)

	for await (const line of file.readLines({ encoding: "utf8", start: 0 })) {
		if (!isInUtilitiesLayer) {
			if (line === "@layer utilities {") {
				isInUtilitiesLayer = true
			}

			continue
		}

		if (isInUtilitiesLayer && line === "}") {
			isInUtilitiesLayer = false

			continue
		}

		if (!isInClass && (/^ {2}\./).test(line)) {
			isInClass = true
			className = `${ line.trim() } `

			if (className.includes(String.raw`.\@container`)) {
				className = className
					// replace \@container to @container
					.replace(String.raw`.\@container`, ".@container")
			}

			emptyClasses.set(className.trim().slice(0, -2), [])

			continue
		}

		if (isInClass) {
			if ((/^ {2}}$/).test(line)) {
				const c = className.trim().slice(0, -2)

				// Add opacity to classes with /100
				if (c.endsWith(String.raw`\/100`)) {
					cssProperties.add("opacity: 0;")
				}

				if (cssProperties.size > 0) {
					emptyClasses.delete(c)
				}
				else {
					switch (true) {
						case (c.startsWith(".duration-")): {
							emptyClasses.delete(c)
							cssProperties.add("transition-duration: inherit;")

							break
						}

						case (c.startsWith(".ease-")): {
							emptyClasses.delete(c)
							cssProperties.add("transition-timing-function: inherit;")

							break
						}

						case (c.startsWith(".snap-")): {
							emptyClasses.delete(c)
							cssProperties.add("scroll-snap-type: inherit;")

							break
						}

						case (c.startsWith(".space-")): {
							emptyClasses.delete(c)
							cssProperties.add("margin-inline-start: inherit;")
							cssProperties.add("margin-inline-end: inherit;")

							break
						}

						case (c.startsWith(".divide-")): {
							emptyClasses.delete(c)
							cssProperties.add("border-inline-style: inherit;")
							cssProperties.add("border-inline-start-width: inherit;")
							cssProperties.add("border-inline-end-width: inherit;")

							break
						}

						case (
							c.startsWith(".from-")
							|| c.startsWith(".via-")
							|| c.startsWith(".to-")
						): {
							emptyClasses.delete(c)
							cssProperties.add("transition-property: inherit;")
							cssProperties.add("transition-timing-function: inherit;")
							cssProperties.add("transition-duration: inherit;")

							break
						}

						case (
							c.startsWith(".inset-shadow-")
							|| c.startsWith(".shadow-")
							|| c.startsWith(".inset-ring-")
							|| c.startsWith(".ring-")
						): {
							emptyClasses.delete(c)
							cssProperties.add("box-shadow: inherit;")

							break
						}

						case (
							c.startsWith(".mask-circle")
							|| c.startsWith(".mask-ellipse")
							|| c.startsWith(".mask-radial-")
						): {
							emptyClasses.delete(c)
							cssProperties.add("mask-image: none;")

							break
						}

						case (c.startsWith(".drop-shadow-")): {
							emptyClasses.delete(c)
							cssProperties.add("filter: drop-shadow(0 0 #0000);")

							break
						}

						case (c.startsWith(".text-shadow-")): {
							emptyClasses.delete(c)
							cssProperties.add("text-shadow: none;")

							break
						}

						case (c.startsWith(".prose-")): {
							emptyClasses.delete(c)
							cssProperties.add("font-size: inherits;")
							cssProperties.add("line-height: inherits;")
							cssProperties.add("margin-top: inherits;")
							cssProperties.add("margin-bottom: inherits;")

							break
						}

						default: {
							break
						}
					}
				}

				// To be added back in generate-order-list
				if (!className.includes(String.raw`.@container\/\[\\dA-Za-z\]`)) {
					className += [...cssProperties].join(" ")
					className += ` ${ line.trim() }`
					classes.push(className)
				}

				isInClass = false
				className = ""
				cssProperties.clear()

				continue
			}
			else if (
				(/^ {4}:where/).test(line)
				|| (/^ {4,6}@media/).test(line)
				|| (/^ {4,6}@supports/).test(line)
				|| (/^ {4,6}&:/).test(line)
			) {
				linesToSkip += 1

				continue
			}
			else if (linesToSkip > 0 && (/ {4,6}}/).test(line)) {
				linesToSkip -= 1

				continue
			}
			else {
				const l = setDefaults(line.trim())
				const c = className.trim().slice(0, -2)
				const v = emptyClasses.get(c) ?? []

				emptyClasses.set(c, [...v, l])

				// remove custom properties
				if (l.search(/^--[^:]+:[^;]+;$/) !== -1) {
					continue
				}

				cssProperties.add(l)
			}
		}
	}

	await file.close()

	classes = classes.toSorted((a, b) => {
		a = a
			.trim()
			.split("{ ")[1]!
			.split(" }")[0]!
		const aArray = a
			.split("; ")
			.map((value) => value.split(": ")[0]!)

		b = b
			.trim()
			.split("{ ")[1]!
			.split(" }")[0]!
		const bArray = b
			.split("; ")
			.map((value) => value.split(": ")[0]!)

		return sorting<string[]>(aArray, bArray)
	})

	await writeFile(getArgv("--out"), classes.join("\n").trim(), { encoding: "utf8", flag: "w" })

	console.log("---EMPTY CLASSES---")
	console.log(JSON.stringify([...emptyClasses.keys()], undefined, "\t"))
	console.log("---EMPTY CLASSES---")

	console.timeEnd("prepare style.css")
})()

function setDefaults (line = ""): string {
	return (line
		// replace quotes value to none
		.replaceAll(new RegExp(`quotes: [^;]+;`, "g"), "quotes: none;")
		// replace url value to ""
		.replaceAll(new RegExp(String.raw`url\("[^"]+"\)`, "g"), "url(\"\")")
		// replace custom property in var
		.replaceAll(new RegExp(String.raw`var\(--[^,\)]+([,\)])`, "g"), "var(--tmp$1")
		// replace oklch value to #000
		.replaceAll(new RegExp(String.raw`oklch\([^\)]+\)`, "g"), "#000")
		// replace auto value to 0
		.replaceAll(new RegExp(String.raw`([ \(])auto`, "g"), "$10")
		// replace css unit numeric value to 0
		.replaceAll(new RegExp(String.raw`([ \(])(-?)\d+(?:\.\d+)?((?:%)|${ units })`, "g"), "$1$20$3")
		// replace numeric value to 0
		.replaceAll(new RegExp(String.raw`([ \(])(-?)\d+(?:\.\d+)?`, "g"), "$1$20")
		// replace fraction value to 0/0
		.replaceAll(new RegExp(String.raw`\d+/\d+`, "g"), "0/0")
		// replace color value #000
		.replaceAll(new RegExp(String.raw`#[0-9a-zA-Z]+([ ;\)])`, "g"), "#000$1")
		// replace content property to none
		.replaceAll(new RegExp(String.raw`content: [^;]+([ ;\)])`, "g"), "content: none$1")
		// replace var(--tmp,) to var(--tmp)
		// .replaceAll(new RegExp(`,\\)`, "g"), ")")
	)
}
