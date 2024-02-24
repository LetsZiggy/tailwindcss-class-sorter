// pnpm run link:files && pnpm run transpile && pnpm run generate:order-lists

import { writeFile } from "node:fs/promises"
import { generator } from "./generator.js"
import { getArgv } from "./helper.js"
import { concentricConfigOrder, recessConfigOrder, smacssConfigOrder } from "./stylelint-config-order.js"
// import type { OrderData } from "./generator.js"

const source: string = getArgv("--src")
const stylelintrcPath: string = getArgv("--stylelintrc")
const out: string = getArgv("--out")

/*
function getRepeatedGroupnames (orderDataArray: OrderData[]): Record<string, number[]> {
	const foundGroupnames = new Set<string>()
	const collection: Record<string, number[]> = {}

	for (const [index, orderData] of orderDataArray.entries()) {
		if (foundGroupnames.has(orderData.group_name)) {
			foundGroupnames.add(orderData.group_name)
			collection[orderData.group_name] = [index]

			continue
		}

		collection[orderData.group_name] = [...collection[orderData.group_name] ?? [], index]
	}

	const repeated: Record<string, number[]> = {}

	for (const [key, value] of Object.entries(collection)) {
		if (value.length > 1) {
			repeated[key] = value
		}
	}

	return repeated
}
/* */

/*
function getLoneClassname (orderDataArray: OrderData[]): Record<string, number[]> {
	const lone: Record<string, number[]> = {}

	for (const [index, orderData] of orderDataArray.entries()) {
		if (orderData.regex.length === 1) {
			lone[orderData.group_name] = [...lone[orderData.group_name] ?? [], index]
		}
	}

	return lone
}
/* */

await (async function () {
	let output = ""

	/* */
	console.time("generator::recess")
	let recess

	try { recess = await generator(recessConfigOrder, source, stylelintrcPath) }
	catch (error) { console.error("recess:", error); return } // eslint-disable-line @stylistic/padding-line-between-statements

	recess.order = recess.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [...new Set(current.regex)],
		}))

	output += `\n"recess": ${ JSON.stringify(recess.order, undefined, "\t") },`

	// console.log("RepeatedGroupnames", getRepeatedGroupnames(recess.order))
	// console.log("LoneClassname", getLoneClassname(recess.order))
	console.timeEnd("generator::recess")
	/* */

	/* */
	console.time("generator::concentric")
	let concentric

	try { concentric = await generator(concentricConfigOrder, source, stylelintrcPath) }
	catch (error) { console.error("concentric:", error); return } // eslint-disable-line @stylistic/padding-line-between-statements

	concentric.order = concentric.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [...new Set(current.regex)],
		}))

	output += `\n"concentric": ${ JSON.stringify(concentric.order, undefined, "\t") },`

	// console.log("RepeatedGroupnames", getRepeatedGroupnames(concentric.order))
	// console.log("LoneClassname", getLoneClassname(concentric.order))
	console.timeEnd("generator::concentric")
	/* */

	/* */
	console.time("generator::smacss")
	let smacss

	try { smacss = await generator(smacssConfigOrder, source, stylelintrcPath) }
	catch (error) { console.error("smacss:", error); return } // eslint-disable-line @stylistic/padding-line-between-statements

	smacss.order = smacss.order
		.map((current) => ({
			group_name: current.group_name,
			regex: [...new Set(current.regex)],
		}))

	output += `\n"smacss": ${ JSON.stringify(smacss.order, undefined, "\t") },`

	// console.log("RepeatedGroupnames", getRepeatedGroupnames(smacss.order))
	// console.log("LoneClassname", getLoneClassname(smacss.order))
	console.timeEnd("generator::smacss")
	/* */

	/* */
	console.time("generate-order-list::write_output")
	output = `{${ output.slice(0, -1) }\n}`
		.replaceAll('\n\t\t\t"', ' "')
		.replaceAll("\n\t\t]", "]")
		.replaceAll('\n\t\t"', ' "')
		.replaceAll("\n\t}", "}")
		.replaceAll("\n\t{ ", "\n\t{")
		.replaceAll('"group_name": "', '"group_name":"')
		.replaceAll('", "regex": [ ', '","regex":[')
		.replaceAll('", "', '","')

	await writeFile(out, output, { encoding: "utf8", flag: "w" })
	console.timeEnd("generate-order-list::write_output")
	/* */
})()
