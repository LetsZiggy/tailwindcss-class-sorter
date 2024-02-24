declare module "tailwindcss/stubs/config.full.js" {
	import type { Config } from "tailwindcss"
	import type { RequiredDeep } from "type-fest"

	declare const config: Config
	export default RequiredDeep<config>
}
