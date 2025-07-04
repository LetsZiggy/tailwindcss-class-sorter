from json import dump
from subprocess import CompletedProcess
from subprocess import run as process_run
from sys import argv
from time import sleep

from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement

from helper import IS_WINDOWS, ROOT_PATH, T_DEFAULTS, BColours, abs_path, init_webdriver


def handle_colors(driver: WebDriver, defaults: T_DEFAULTS) -> T_DEFAULTS:
	parent_element: WebElement = driver.find_element(
		By.CSS_SELECTOR, ".not-prose.grid.grid-cols-\\[auto_minmax\\(0\\,_1fr\\)\\].items-center.gap-4"
	)
	sleep(0.1)
	defaults["colour-relative"] = [f"{p.text.strip().lower()}" for p in parent_element.find_elements(By.TAG_NAME, "p")]  # pyright: ignore[reportUnknownMemberType]

	return defaults


def handle_responsive_design(driver: WebDriver, defaults: T_DEFAULTS) -> T_DEFAULTS:
	table_elements: list[WebElement] = driver.find_elements(By.TAG_NAME, "table")
	sleep(0.1)
	table_elements_filtered: filter[WebElement] = filter(
		lambda x: "BREAKPOINT" in x.find_element(By.CSS_SELECTOR, "thead tr th:first-child").text.strip().upper(),  # pyright: ignore[reportUnknownMemberType]
		table_elements,
	)
	sleep(0.1)
	table_element: WebElement = list(table_elements_filtered)[0]
	screen_elements: list[WebElement] = table_element.find_elements(By.CSS_SELECTOR, "tbody tr td:first-child code")  # pyright: ignore[reportUnknownMemberType]
	sleep(0.1)
	defaults["screen-size"] = ["xs"] + list(map(lambda x: x.text.strip().lower(), screen_elements))

	return defaults


def handle_font_letter(driver: WebDriver, defaults: T_DEFAULTS, url: str) -> T_DEFAULTS:
	# Allows for pages with and without "Show more" button
	button_elements: list[WebElement] = driver.find_elements(By.TAG_NAME, "button")
	sleep(0.1)
	button_elements_filtered: filter[WebElement] = filter(lambda x: x.text.upper() == "SHOW MORE", button_elements)
	sleep(0.1)
	for button in button_elements_filtered:
		button.click()
	sleep(0.1)
	td_elements = driver.find_elements(
		By.CSS_SELECTOR,
		"#quick-reference tbody tr td:first-child",
	)
	if "font-size" in url:
		class_names = [td.text.lower().split("text-")[1] for td in td_elements]
		defaults["font-size"] = list(filter(lambda x: "(" not in x and "[" not in x, class_names))
	if "font-weight" in url:
		class_names = [td.text.lower().split("font-")[1] for td in td_elements]
		defaults["font-weight"] = list(filter(lambda x: "(" not in x and "[" not in x, class_names))
	if "letter-spacing" in url:
		class_names = [td.text.lower().split("tracking-")[1] for td in td_elements]
		defaults["letter-spacing"] = list(filter(lambda x: "(" not in x and "[" not in x, class_names))

	return defaults


def main(driver_path: str | None, urls: list[str], defaults: T_DEFAULTS):
	# --------------------------------------------------------------------------------------------------------
	# set new driver instance each iteration because driver.get(url) doesn't work in subsequent loop iteration
	# --------------------------------------------------------------------------------------------------------
	for url in urls:
		driver = init_webdriver(driver_path)
		url = url.strip()

		try:
			driver.get(url)
		except Exception as e:
			print(e)
			break
		else:
			print(driver.current_url)

			if "colors" in url:
				defaults = handle_colors(driver, defaults)
			if "responsive-design" in url:
				defaults = handle_responsive_design(driver, defaults)
			if "font" in url or "letter" in url:
				defaults = handle_font_letter(driver, defaults, url)
		finally:
			driver.close()
			driver.quit()

	defaults_list_path: str = abs_path("defaults-list.json")
	with open(defaults_list_path, mode="w+", encoding="utf-8") as file:
		dump(defaults, file, indent="\t")
	p: CompletedProcess[bytes] = process_run(
		[
			"ln",
			"-frs",
			# f"{ROOT_PATH}/_python_/defaults-list.json",
			abs_path([ROOT_PATH, "_python_", "defaults-list.json"]),
			# f"{ROOT_PATH}/_nodejs_/defaults-list.json",
			abs_path([ROOT_PATH, "_nodejs_", "defaults-list.json"]),
			# f"{ROOT_PATH}/order_list_generator/defaults-list.json",
			# abs_path([ROOT_PATH, "order_list_generator", "defaults-list.json"]),
		],
		shell=IS_WINDOWS,
	)
	if p.returncode != 0:
		print(f"{BColours.FAIL}--- failed linking defaults-list.json ---{BColours.ENDC}")
		return


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]
	if len(args) == 0:
		print(f"{BColours.FAIL}python get-defaults.py [DRIVER_PATH]{BColours.ENDC}")
	else:
		driver_path: str = abs_path(args[0])
		urls: list[str] = [
			"https://tailwindcss.com/docs/colors",
			"https://tailwindcss.com/docs/responsive-design",
			"https://tailwindcss.com/docs/font-size",
			"https://tailwindcss.com/docs/font-weight",
			"https://tailwindcss.com/docs/letter-spacing",
		]
		defaults: T_DEFAULTS = {}
		# https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units
		defaults["absolute-length-unit"] = ["cm", "in", "mm", "pc", "pt", "px", "Q"]
		defaults["angle-unit"] = ["deg", "grad", "rad", "turn"]
		defaults["default-viewport-unit"] = ["vb", "vh", "vi", "vmax", "vmin", "vw"]
		defaults["dynamic-viewport-unit"] = ["dvb", "dvh", "dvi", "dvmax", "dvmin", "dvw"]
		defaults["frequency-unit"] = ["Hz", "kHz"]
		defaults["large-viewport-percentage-unit"] = ["lvb", "lvh", "lvi", "lvmax", "lvmin", "lvw"]
		defaults["local-font-relative-length-unit"] = ["cap", "ch", "em", "ex", "ic", "lh"]
		defaults["physical-unit"] = ["cm", "in", "mm", "pc", "pt", "Q"]
		defaults["relative-length-unit"] = [
			"cap",
			"ch",
			"em",
			"ex",
			"ic",
			"lh",
			"rem",
			"rlh",
			"vb",
			"vh",
			"vi",
			"vmax",
			"vmin",
			"vw",
		]
		defaults["resolution-unit"] = ["dpcm", "dpi", "dppx", "x"]
		defaults["root-font-relative-length-unit"] = ["rcap", "rch", "rem", "rex", "ric", "rlh"]
		defaults["small-viewport-percentage-unit"] = ["svb", "svh", "svi", "svmax", "svmin", "svw"]
		defaults["time-unit"] = ["ms", "s"]
		defaults["viewport-unit"] = ["dvh", "dvw", "lvh", "lvw", "svh", "svw", "vb", "vh", "vi", "vmax", "vmin", "vw"]
		defaults["visual-angle-unit"] = ["px"]
		# https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/compat/colors.ts
		defaults["colour-absolute"] = ["inherit", "current", "transparent", "black", "white"]
		# https://github.com/tailwindlabs/tailwindcss/blob/v3.4.17/stubs/config.full.js#L605
		defaults["line-height"] = ["none", "tight", "snug", "normal", "relaxed", "loose"]

		main(driver_path, urls, defaults)
