/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

/*
 * Update tailwindcss version:
 *   1. Update tailwindcss settings
 *   2. pnpm run generate
 */

const stub = require("tailwindcss/stubs/config.full")

/**
 * @type { import("tailwindcss").Config }
 */
module.exports = {
	content: ["content.html"],
	safelist: [{ pattern: /.+/ }],
	presets: [],
	darkMode: "media", // "media" | "class"
	theme: stub.theme,
	// corePlugins: [],
	plugins: [
		require("@tailwindcss/aspect-ratio"),
		require("@tailwindcss/forms")({ strategy: "class" }),
		require("@tailwindcss/container-queries"),
		require("@tailwindcss/typography"),
	],
}
