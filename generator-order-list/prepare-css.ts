/* eslint-disable prefer-regex-literals, regexp/no-useless-escape, regexp/use-ignore-case, unicorn/no-break-in-nested-loop */

// pnpm run link:files && pnpm run transpile && pnpm run prepare:css

import { open, writeFile } from "node:fs/promises"
import defaults from "./defaults-list.json" with { type: "json" }
import { getArgv/* , sorting */ } from "./helper.js"
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
	let classname = ""
	let isInClass = false
	let isInUtilitiesLayer = false
	let linesToSkip = 0

	// main loop
	const file: FileHandle = await open(getArgv("--in"), "r", 0o644)
	const lines = file.readLines({ encoding: "utf8", start: 0 })

	for await (const line of lines) {
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

		if (!isInClass && line.startsWith(`${ " ".repeat(2) }.`)) {
			isInClass = true
			classname = `${ line.trim() } `

			if (classname.includes(r`.\@container`)) {
				classname = classname
					// replace \@container to @container
					.replace(r`.\@container`, ".@container")
			}

			emptyClasses.set(classname.trim().slice(0, -2), [])

			continue
		}

		if (isInClass) {
			if (line === `${ " ".repeat(2) }}`) {
				const c = classname.trim().slice(0, -2)

				// Add opacity to classes with /100
				if (c.endsWith(r`\/100`) && cssProperties.size === 0) {
					cssProperties.add("opacity: inherit;")
				}

				// Add properties to:
				//   - legacy and deprecated classes
				//   - classes with only custom properties (see emptyClasses)
				//   - classes with no matching properties but with related sibling classes
				switch (true) {
					// ### 3RD PARTY PACKAGE ###

					// --- https://github.com/tailwindlabs/tailwindcss-typography ---
					case (c.startsWith(".prose-")): {
						emptyClasses.delete(c)
						cssProperties.add("font-size: inherit;")
						cssProperties.add("line-height: inherit;")
						cssProperties.add("margin-top: inherit;")
						cssProperties.add("margin-bottom: inherit;")

						break
					}

					// ### LAYOUT ###

					// --- TOP / RIGHT / BOTTOM / LEFT ---
					case (
						(c.startsWith(r`.inset-`) || c.startsWith(r`.-inset-`))
						&& (c.includes(r`-y-`) || c.includes(r`-x-`))
					): {
						cssProperties.add("inset-block: inherit;")
						cssProperties.add("inset-inline: inherit;")
						// `inset-#>` property to be added ---after--- `inset` property in generator.ts (see generator.ts)
						cssProperties.clear()
						cssProperties.add("inset-#>: inherit;")

						break
					}

					// --- TOP / RIGHT / BOTTOM / LEFT ---
					case (
						c.startsWith(".start")
						|| c.startsWith(".-start")
						|| c.startsWith(".end")
						|| c.startsWith(".-end")
					): {
						cssProperties.add("inset-inline-start: inherit;")
						cssProperties.add("inset-inline-end: inherit;")
						// `inset-##>` property to be added ---after--- `inset-#>` property in generator.ts (see generator.ts)
						cssProperties.clear()
						cssProperties.add("inset-##>: inherit;")

						break
					}

					// ### FLEXBOX & GRID ###

					// https://github.com/tailwindlabs/tailwindcss/pull/14721
					// --- FLEX-GROW | FLEX-SHRINK ---
					case (c === ".flex-grow" || c === ".flex-shrink"): {
						cssProperties.add("flex-grow: inherit;")
						cssProperties.add("flex-shrink: inherit;")
						// `flex-#>` property to be added ---after--- `flex` property in generator.ts (see generator.ts)
						cssProperties.clear()
						cssProperties.add("flex-#>: inherit;")

						break
					}

					// ### SPACING ###

					// --- MARGIN ---
					case (c.startsWith(".space-") || c.startsWith(".-space-")): {
						emptyClasses.delete(c)
						cssProperties.add("margin: inherit;")
						// `<#-margin` property to be added ---before--- `margin` property in generator.ts (see generator.ts)
						cssProperties.clear()
						cssProperties.add("<#-margin: inherit;")

						break
					}

					// ### SIZING ###

					// --- WIDTH | HEIGHT ---
					case (c.startsWith(r`.size-`)): {
						cssProperties.add("width: inherit;")
						cssProperties.add("height: inherit;")
						// `<#-width` property to be added ---before--- `width` property in generator.ts (see generator.ts)
						cssProperties.clear()
						cssProperties.add("<#-width: inherit;")

						break
					}

					// ### TYPOGRAPHY ###

					// https://github.com/tailwindlabs/tailwindcss/pull/19157
					// --- WORD-BREAK | OVERFLOW-WRAP ---
					case (c === ".break-words"): {
						cssProperties.add("word-break: inherit;")

						break
					}

					// ### BACKGROUNDS ###

					// --- BACKGROUND-IMAGE ---
					case (
						c.startsWith(".from-")
						|| c.startsWith(".via-")
						|| c.startsWith(".to-")
					): {
						emptyClasses.delete(c)
						cssProperties.add("background-image: inherit;")
						cssProperties.add("transition-property: inherit;")
						cssProperties.add("transition-duration: inherit;")
						cssProperties.add("transition-timing-function: inherit;")

						break
					}

					// ### BORDERS ###

					// --- BORDER-WIDTH | BORDER-COLOR | BORDER-STYLE ---
					case (c.startsWith(".divide-")): {
						if (c.includes("-white") || c.includes("-red")) {
							emptyClasses.delete(c)
							cssProperties.add("border-color: inherit;")
							// `<#-border` property to be added ---before--- `border` property in generator.ts (see generator.ts)
							cssProperties.clear()
							cssProperties.add("<#-border: inherit;")
						}

						if (
							c.includes(r`-\(`)
							|| c.includes(r`-\[`)
							|| c.includes("-y")
							|| c.includes("-x")
						) {
							emptyClasses.delete(c)
							cssProperties.add("border: inherit;")
							cssProperties.add("border-block-style: inherit;")
							cssProperties.add("border-block-start-width: inherit;")
							cssProperties.add("border-block-end-width: inherit;")
							cssProperties.add("border-inline-style: inherit;")
							cssProperties.add("border-inline-start-width: inherit;")
							cssProperties.add("border-inline-end-width: inherit;")
							// `<##-border` property to be added ---before--- `<#-border` property in generator.ts (see generator.ts)
							cssProperties.clear()
							cssProperties.add("<##-border: inherit;")
						}

						if (cssProperties.has(`border-style: ${ c.slice(8) };`)) {
							emptyClasses.delete(c)
							cssProperties.add("border-style: inherit;")
							// `<#-border-style` property to be added ---before--- `border-style` property in generator.ts (see generator.ts)
							cssProperties.clear()
							cssProperties.add("<#-border-style: inherit;")
						}

						break
					}

					// --- BORDER-WIDTH ---
					case (
						c === ".border"
						|| c === ".border-5"
						|| c.startsWith(r`.border-\(`)
						|| c.startsWith(r`.border-\[`)
					): {
						cssProperties.add("border: inherit;")

						break
					}

					// --- BORDER-WIDTH ---
					case (c.startsWith(".border-y")): {
						cssProperties.add("border: inherit;")
						cssProperties.add("border-block: inherit;")

						break
					}

					// --- BORDER-WIDTH ---
					case (c.startsWith(".border-x")): {
						cssProperties.add("border: inherit;")
						cssProperties.add("border-inline: inherit;")

						break
					}

					// ### EFFECTS ###

					// --- BOX-SHADOW ---
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

					// --- TEXT-SHADOW ---
					case (c.startsWith(".text-shadow-")): {
						emptyClasses.delete(c)
						cssProperties.add("text-shadow: inherit;")

						break
					}

					// --- MASK-IMAGE ---
					case (
						c.startsWith(".mask-circle")
						|| c.startsWith(".mask-ellipse")
						|| c.startsWith(".mask-radial-")
					): {
						emptyClasses.delete(c)
						cssProperties.add("mask-image: inherit;")

						break
					}

					// ### FILTERS ###

					// --- DROP-SHADOW ---
					case (c.startsWith(".drop-shadow-")): {
						emptyClasses.delete(c)
						cssProperties.add("filter: inherit;")

						break
					}

					// ### TRANSITIONS & ANIMATION ###

					// --- TRANSITION-DURATION ---
					case (c.startsWith(".duration-")): {
						emptyClasses.delete(c)
						cssProperties.add("transition-duration: inherit;")

						break
					}

					// --- TRANSITION-TIMING-FUNCTION ---
					case (c.startsWith(".ease-")): {
						emptyClasses.delete(c)
						cssProperties.add("transition-timing-function: inherit;")

						break
					}

					// ### INTERACTIVITY ###

					// --- SCROLL-MARGIN ---
					case (c.startsWith(".scroll-m") || c.startsWith(".-scroll-m")): {
						cssProperties.add("scroll-margin: inherit;")

						break
					}

					// --- SCROLL-PADDING ---
					case (c.startsWith(".scroll-p") || c.startsWith(".-scroll-p")): {
						cssProperties.add("scroll-padding: inherit;")

						break
					}

					// --- SCROLL-SNAP-TYPE ---
					case (c.startsWith(".snap-")): {
						emptyClasses.delete(c)
						cssProperties.add("scroll-snap-type: inherit;")

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

				// `.@container\/\[\\w\\-\]` to be added back in generate-order-list.ts as `@container/[\w\-]` (see generator.ts)
				if (!classname.includes(r`.@container\/\[\\w\\-\]`)) {
					classname += cssPropertiesArray.join(" ")
					classname += ` ${ line.trim() }`
					classLines.push(classname)
				}

				isInClass = false
				classname = ""
				cssProperties.clear()

				continue
			}
			if (
				line.startsWith(`${ " ".repeat(4) }:where`)
				|| (
					line.startsWith(`${ " ".repeat(4) }@media`)
					|| line.startsWith(`${ " ".repeat(6) }@media`)
				)
				|| (
					line.startsWith(`${ " ".repeat(4) }@supports`)
					|| line.startsWith(`${ " ".repeat(6) }@supports`)
				)
				|| (
					line.startsWith(`${ " ".repeat(4) }&:`)
					|| line.startsWith(`${ " ".repeat(6) }&:`)
				)
			) {
				linesToSkip += 1

				continue
			}
			if (
				linesToSkip > 0
				&& (
					line.startsWith(`${ " ".repeat(4) }}`)
					|| line.startsWith(`${ " ".repeat(6) }}`)
				)
			) {
				linesToSkip -= 1

				continue
			}

			const l = setDefaults(line.trim())
			const c = classname.trim().slice(0, -2)
			const v = emptyClasses.get(c) ?? []

			emptyClasses.set(c, [...v, l])

			// remove custom properties
			// if (l.search(/^--[^:]+:[^;]+;$/) !== -1) { continue }

			cssProperties.add(l)
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

	if (emptyClasses.keys().toArray().length > 0) {
		console.log("--- EMPTY CLASSES ---")
		console.log(JSON.stringify(emptyClasses.keys().toArray(), undefined, "\t"))
		console.log("--- EMPTY CLASSES ---")
	}

	console.timeEnd("prepare-css")
})()

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
