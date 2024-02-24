import { argv } from "node:process"

export type Prettify<T> = { [K in keyof T]: T[K] } & {}
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
			return v.split("=", 2)[1]!
		}
	}

	throw new Error("`key` not in argv")
}

export function sorting<T extends string[] | string> (a: T, b: T): CompareResult {
	if (Array.isArray(a) && Array.isArray(b)) {
		const lastIndex: number = Math.min(a.length, b.length) - 1
		let index = 0

		while (index <= lastIndex) {
			if (a.at(index) !== b.at(index)) {
				// a is shorter than b; push b before a
				if (a.at(index) === undefined && b.at(index) !== undefined) {
					return 1
				}

				// b is shorter than a; push a before b
				if (a.at(index) !== undefined && b.at(index) === undefined) {
					return -1
				}

				const sort = a.at(index)!.localeCompare(b.at(index)!)

				if (sort !== 0) {
					return normaliseCompareResult(sort)
				}
			}

			index += 1
		}

		return 0
	}

	if (typeof a === "string" && typeof b === "string") {
		return normaliseCompareResult(a.localeCompare(b))
	}

	throw new Error("Invalid arguments")
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
			: (result > 0)
				? 1
				: 0
	)
}
