import { argv } from "node:process"

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

export function sorting<T extends string | string[]> (a: T, b: T): (-1 | 0 | 1) {
	if (Array.isArray(a) && Array.isArray(b)) {
		const lastCount: number = Math.min(a.length, b.length) - 1
		let count = 0
		let sort: -1 | 0 | 1 = 0

		while (count <= lastCount) {
			if (a[count] !== b[count]) {
				/** a is shorter than b; push b before a */
				if (a[count] === undefined && b[count] !== undefined) {
					sort = 1

					break
				}

				/** b is shorter than a; push a before b */
				if (a[count] !== undefined && b[count] === undefined) {
					sort = -1

					break
				}

				sort = sortString(a[count]!, b[count]!)

				if (sort !== 0) {
					break
				}
			}

			count += 1
		}

		return sort
	}

	if (typeof a === "string" && typeof b === "string") {
		return sortString(a, b)
	}

	throw new Error("Invalid arguments")
}

function sortString (a: string, b: string): (-1 | 0 | 1) {
	const lastCount: number = Math.min(a.length, b.length) - 1
	let count = 0
	let sort: -1 | 0 | 1 = 0

	while (count <= lastCount) {
		if (a[count] !== b[count]) {
			/** a is shorter than b */
			if (Number.isNaN(Number(a[count])) && !Number.isNaN(Number(b[count]))) {
				sort = -1
			}
			/** b is shorter than a */
			else if (!Number.isNaN(Number(a[count])) && Number.isNaN(Number(b[count]))) {
				sort = 1
			}
			else {
				sort = (a[count]! < b[count]!) ? -1 : 1
			}

			break
		}

		count++
	}

	return sort
}
