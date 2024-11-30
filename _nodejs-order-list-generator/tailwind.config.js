/*
 * Update tailwindcss version:
 *   1. Update tailwindcss settings
 *   2. pnpm run generate
 */

import { default as aspectRatioPlugin } from "@tailwindcss/aspect-ratio"
import { default as containerQueriesPlugin } from "@tailwindcss/container-queries"
import { default as formsPlugin } from "@tailwindcss/forms"
import { default as typographyPlugin } from "@tailwindcss/typography"
import { default as stub } from "tailwindcss/stubs/config.full.js"

/**
 * @type { import("tailwindcss").Config }
 */
// @ts-expect-error: containerQueriesPlugin type not matching plugins type
export default {
	content: ["content.html"],
	safelist: [{ pattern: /.+/ }],
	presets: [],
	darkMode: "media", // "media" | "class"
	theme: { ...stub.theme },
	// corePlugins: [],
	plugins: [
		aspectRatioPlugin,
		formsPlugin({ strategy: "class" }),
		containerQueriesPlugin,
		typographyPlugin,
	],
}
