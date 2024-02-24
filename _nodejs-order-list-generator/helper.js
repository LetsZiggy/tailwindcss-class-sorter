/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-var-requires */

const { argv } = require("node:process")

function getArgv (key) {
	// if argv separated with space (" ")
	const index = argv.indexOf(key)

	if (index > -1) {
		return argv[index + 1]
	}

	// if argv separated with equal ("=")
	for (const v of argv) {
		if (v.startsWith(`${ key }=`)) {
			return v.split("=")[1]
		}
	}
}

module.exports = {
	getArgv,
}
