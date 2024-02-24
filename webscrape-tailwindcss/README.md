### Instructions

1. Install/Updated packages/webdriver
	- [geckodriver](https://github.com/mozilla/geckodriver/releases)
		- executable: `selenium-drivers/geckodriver`
		- version-documentation: `selenium-drivers/geckodriver-version.txt`
1. `uv run get-urls.py <OUTPUT_PATH> <DRIVER_PATH>`
	- `uv run get-urls.py urls.txt selenium-drivers/geckodriver`
1. `uv run get-defaults.py <OUTPUT_PATH> <DRIVER_PATH>`
	- `uv run get-defaults.py defaults-list.json selenium-drivers/geckodriver`
1. `uv run get-styles.py <OUTPUT_PATH> <DRIVER_PATH> <URLS_PATH> <DEFAULTS_PATH> <ADDITIONAL_CLASSES_PATH>`
	- `uv run get-styles.py styles-list.json selenium-drivers/geckodriver urls.txt defaults-list.json additional-classes-list.json`
1. `uv run generate-safelist.py <OUTPUT_PATH> <DEFAULTS_PATH> <STYLES_PATH>`
	- `uv run generate-safelist.py '../generator-order-list/safelist.txt' defaults-list.json styles-list.json`

### [tailwindcss.com commit references](https://github.com/tailwindlabs/tailwindcss.com/tree/main)
- [v4.0.&#42;](https://github.com/tailwindlabs/tailwindcss.com/tree/980ac97c93143f49cde209ea840405c0b8aef51a)
	- v4.0.17
	- 980ac97c93143f49cde209ea840405c0b8aef51a
