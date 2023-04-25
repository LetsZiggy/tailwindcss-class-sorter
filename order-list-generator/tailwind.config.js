/*
 * Update tailwindcss version:
 * 	1. Update tailwindcss settings
 * 	2. pnpm run generate-css
 * 	3. pnpm run generate-order-lists
 */

const stub = require("tailwindcss/stubs/config.full")

module.exports = {
	content: [ "content.html" ],
	safelist: [{ pattern: /.+/ }],
	presets: [],
	darkMode: "media", // "class"
	theme: { ...stub.theme },
	plugins: [],
}
