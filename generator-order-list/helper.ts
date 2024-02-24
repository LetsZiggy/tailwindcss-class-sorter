import { argv } from "node:process"

export type NonEmptyArray<T> = [T, ...T[]]

type CompareResult = -1 | 0 | 1

// Must match with "tailwindcss-class-sorter/webscrape-tailwindcss/helper.py"
export const skipStylesGroupsColourRemove: Record<string, string> = {
	"tailwindcss-typography": "prose-",
	"font-weight": "font-black",
	"white-space": "whitespace-",
	"filter-grayscale": "grayscale",
	"backdrop-filter-grayscale": "backdrop-grayscale",
}

export function getArgv (key: string): string {
	// if argv separated with space (" ")
	const index = argv.indexOf(key)

	if (index !== -1) {
		return argv[index + 1]!
	}

	// if argv separated with equal ("=")
	for (const v of argv) {
		if (v.startsWith(`${ key }=`)) {
			return v.split("=")[1]!
		}
	}

	throw new Error("`key` not in argv")
}

export function sorting<T extends string[] | string> (a: T, b: T): CompareResult {
	if (Array.isArray(a) && Array.isArray(b)) {
		const lastIndex: number = Math.min(a.length, b.length) - 1
		let index = 0
		let sort: CompareResult = 0

		while (index <= lastIndex) {
			if (a[index] !== b[index]) {
				// a is shorter than b; push b before a
				if (a[index] === undefined && b[index] !== undefined) {
					sort = 1

					break
				}

				// b is shorter than a; push a before b
				if (a[index] !== undefined && b[index] === undefined) {
					sort = -1

					break
				}

				sort = sortString(a[index]!, b[index]!)

				if (sort !== 0) {
					break
				}
			}

			index += 1
		}

		return sort
	}

	if (typeof a === "string" && typeof b === "string") {
		return sortString(a, b)
	}

	throw new Error("Invalid arguments")
}

function sortString (a: string, b: string): CompareResult {
	const lastIndex: number = Math.min(a.length, b.length) - 1
	let index = 0
	let sort: CompareResult = 0

	while (index <= lastIndex) {
		if (a[index] !== b[index]) {
			/** a is shorter than b */
			if (Number.isNaN(Number(a[index])) && !Number.isNaN(Number(b[index]))) {
				sort = -1
			}
			/** b is shorter than a */
			else if (!Number.isNaN(Number(a[index])) && Number.isNaN(Number(b[index]))) {
				sort = 1
			}
			else {
				sort = (a[index]! < b[index]!) ? -1 : 1
			}

			break
		}

		index++
	}

	return sort
}

export function normaliseCompareResult (result: number | [boolean, boolean]): CompareResult {
	if (Array.isArray(result)) {
		return (
			(result[0] && !result[1])
				? -1
				: (!result[0] && result[1])
					? 1
					: 0
		)
	}

	return (
		(result < 0)
			? -1
			: result > 0
				? 1
				: 0
	)
}
