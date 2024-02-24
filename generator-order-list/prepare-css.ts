/* eslint-disable prefer-regex-literals, regexp/no-useless-escape, regexp/use-ignore-case */

// pnpm run link:files && pnpm run transpile && pnpm run prepare:css

import { open, writeFile } from "node:fs/promises"
import defaults from "./defaults-list.json" with { type: "json" }
import { getArgv } from "./helper.js" // sorting
import type { FileHandle } from "node:fs/promises"

const r = String.raw

const units = (Object.keys(defaults) as Array<keyof typeof defaults>)
	.filter((key) => key.includes("-unit"))
	.map((key) => defaults[key].map((unit: string) => `(?:${ unit })`).join("|"))
	.join("|")

await (async function () {
	console.time("prepare-css")

	const cssProperties = new Set<string>()
	const emptyClasses = new Map<string, string[]>()
	const classLines: string[] = []
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

		if (!isInClass && line.startsWith(`${ spaces(2) }.`)) { // (/^ {2}\./).test(line)
			isInClass = true
			className = `${ line.trim() } `

			if (className.includes(r`.\@container`)) {
				className = className
					// replace \@container to @container
					.replace(r`.\@container`, ".@container")
			}

			emptyClasses.set(className.trim().slice(0, -2), [])

			continue
		}

		if (isInClass) {
			if (line === `${ spaces(2) }}`) { // (/^ {2}}$/).test(line)
				const c = className.trim().slice(0, -2)

				// Add opacity to classes with /100
				if (c.endsWith(r`\/100`)) {
					cssProperties.add("opacity: 0;")
				}

				// Add properties to classes with only custom properties (see emptyClasses)
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

				const cssPropertiesArray: string[] = [...cssProperties]

				// Remove custom properties before counting number of properties
				if (cssPropertiesArray.some((current) => !current.startsWith("--"))) {
					emptyClasses.delete(c)
				}

				// `.@container\/\[\\dA-Za-z\]` to be added back in generate-order-list.ts as `@container/[\dA-Za-z]`
				if (!className.includes(r`.@container\/\[\\dA-Za-z\]`)) {
					className += cssPropertiesArray.join(" ")
					className += ` ${ line.trim() }`
					classLines.push(className)
				}

				isInClass = false
				className = ""
				cssProperties.clear()

				continue
			}
			else if (
				// (/^ {4}:where/).test(line)
				line.startsWith(`${ spaces(4) }:where`)
				|| (
					line.startsWith(`${ spaces(4) }@media`)
					|| line.startsWith(`${ spaces(6) }@media`)
				) // (/^ {4,6}@media/).test(line)
				|| (
					line.startsWith(`${ spaces(4) }@supports`)
					|| line.startsWith(`${ spaces(6) }@supports`)
				) // (/^ {4,6}@supports/).test(line)
				|| (
					line.startsWith(`${ spaces(4) }&:`)
					|| line.startsWith(`${ spaces(6) }&:`)
				) // (/^ {4,6}&:/).test(line)
			) {
				linesToSkip += 1

				continue
			}
			else if (
				linesToSkip > 0
				&& (
					line.startsWith(`${ spaces(4) }}`)
					|| line.startsWith(`${ spaces(6) }}`)
				) // (/^ {4,6}}/).test(line)
			) {
				linesToSkip -= 1

				continue
			}
			else {
				const l = setDefaults(line.trim())
				const c = className.trim().slice(0, -2)
				const v = emptyClasses.get(c) ?? []

				emptyClasses.set(c, [...v, l])

				// remove custom properties
				// if (l.search(/^--[^:]+:[^;]+;$/) !== -1) { continue }

				cssProperties.add(l)
			}
		}
	}

	await file.close()

	/*
	// sort: decending amount of css properties
	classLines.sort((a, b) => {
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
	/* */

	await writeFile(getArgv("--out"), classLines.join("\n").trim(), { encoding: "utf8", flag: "w" })

	if ([...emptyClasses.keys()].length > 0) {
		console.log("--- EMPTY CLASSES ---")
		console.log(JSON.stringify([...emptyClasses.keys()], undefined, "\t"))
		console.log("--- EMPTY CLASSES ---")
	}

	console.timeEnd("prepare-css")
})()

function spaces (number_: number): string {
	switch (number_) {
		case 2: {
			return "  "
		}

		case 4: {
			return "    "
		}

		case 6: {
			return "      "
		}

		case 8: {
			return "        "
		}

		case 10: {
			return "          "
		}

		default: {
			return Array.from({ length: number_ }, () => " ").join("")
		}
	}
}

function setDefaults (line = ""): string {
	return (line
		// replace quotes value to none
		.replaceAll(new RegExp(`quotes: [^;]+;`, "g"), "quotes: none;")
		// replace url value to ""
		.replaceAll(new RegExp(r`url\("[^"]+"\)`, "g"), "url(\"\")")
		// replace custom property in var
		.replaceAll(new RegExp(r`var\(--[^,\)]+([,\)])`, "g"), "var(--tmp$1")
		// replace oklch value to #000
		.replaceAll(new RegExp(r`oklch\([^\)]+\)`, "g"), "#000")
		// replace auto value to 0
		.replaceAll(new RegExp(r`([ \(])auto`, "g"), "$10")
		// replace css unit numeric value to 0
		.replaceAll(new RegExp(r`([ \(])(-?)\d+(?:\.\d+)?((?:%)|${ units })`, "g"), "$1$20$3")
		// replace numeric value to 0
		.replaceAll(new RegExp(r`([ \(])(-?)\d+(?:\.\d+)?`, "g"), "$1$20")
		// replace fraction value to 0/0
		.replaceAll(new RegExp(r`\d+/\d+`, "g"), "0/0")
		// replace colour value #000
		.replaceAll(new RegExp(r`#[0-9a-zA-Z]+([ ;\)])`, "g"), "#000$1")
		// replace content property to none
		.replaceAll(new RegExp(r`content: [^;]+([ ;\)])`, "g"), "content: none$1")
		// replace var(--tmp,) to var(--tmp)
		// .replaceAll(new RegExp(`,\\)`, "g"), ")")
	)
}
