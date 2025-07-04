### Instructions

1. Install/Updated packages/webdriver
	- [geckodriver](https://github.com/mozilla/geckodriver/releases)
		- executable: `./selenium-drivers/geckodriver`
		- version-documentation: `./selenium-drivers/geckodriver-version.txt`
1. `python get-pages.py <DRIVER_PATH>`
	- `python get-pages.py ./selenium-drivers/geckodriver`
1. `python get-defaults.py <DRIVER_PATH>`
	- `python get-defaults.py ./selenium-drivers/geckodriver`
1. `python get-styles.py <DRIVER_PATH>`
	- `python get-styles.py ./selenium-drivers/geckodriver`
1. `python generate-safelist.py`
