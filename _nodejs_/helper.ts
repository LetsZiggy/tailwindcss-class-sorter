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
