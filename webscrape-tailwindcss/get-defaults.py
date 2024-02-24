from json import dump as json_dump
from sys import argv
from time import sleep

from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement

from helper import T_DEFAULTS, BColours, abs_path, init_webdriver

# from subprocess import CompletedProcess
# from subprocess import run as process_run
# from helper import IS_WINDOWS, ROOT_PATH


def handle_colors(driver: WebDriver, defaults: T_DEFAULTS) -> T_DEFAULTS:
	parent_element: WebElement = driver.find_element(
		By.CSS_SELECTOR, r".not-prose.grid.grid-cols-\[auto_minmax\(0\,_1fr\)\].items-center.gap-4"
	)
	sleep(0.2)
	defaults["colour-relative"] = [f"{p.text.strip().lower()}" for p in parent_element.find_elements(By.TAG_NAME, "p")]

	return defaults


def handle_responsive_design(driver: WebDriver, defaults: T_DEFAULTS) -> T_DEFAULTS:
	table_elements: list[WebElement] = driver.find_elements(By.TAG_NAME, "table")
	sleep(0.2)
	table_elements_filtered: filter[WebElement] = filter(
		lambda x: "BREAKPOINT" in x.find_element(By.CSS_SELECTOR, "thead tr th:first-child").text.strip().upper(),
		table_elements,
	)
	sleep(0.2)
	table_element: WebElement = next(iter(table_elements_filtered))
	screen_elements: list[WebElement] = table_element.find_elements(By.CSS_SELECTOR, "tbody tr td:first-child code")
	sleep(0.2)
	defaults["screen-size"] = ["xs"] + [element.text.strip().lower() for element in screen_elements]

	return defaults


def handle_font_letter(driver: WebDriver, defaults: T_DEFAULTS, url: str) -> T_DEFAULTS:
	# allows for urls with and without "Show more" button
	sleep(0.2)
	driver.execute_script(  # pyright: ignore[reportUnknownMemberType]
		r"""
		const buttons = [... document.querySelectorAll("button")].filter((elem) => elem.textContent.trim().toUpperCase() === "SHOW MORE");
		if (buttons.length > 0) {
			buttons.at(0).click();
		}
		"""
	)
	# sleep(0.2)
	# button_elements: list[WebElement] = driver.find_elements(By.TAG_NAME, "button")
	# sleep(0.2)
	# button_elements_filtered: filter[WebElement] = filter(
	# 	lambda x: x.text.strip().upper() == "SHOW MORE", button_elements
	# )
	# sleep(0.2)
	# for button in button_elements_filtered:
	# 	button.click()
	# 	break
	sleep(0.2)
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


def get_url_defaults(
	defaults: T_DEFAULTS, driver_path: str, urls: list[str], print_max_length: int
) -> tuple[T_DEFAULTS, list[str]]:
	retry_urls: list[str] = []

	# --------------------------------------------------------------------------------------------------------
	# set new driver instance each iteration because driver.get(url) doesn't work in subsequent loop iteration
	# --------------------------------------------------------------------------------------------------------
	for url in urls:
		driver = init_webdriver(driver_path)
		driver.implicitly_wait(30)
		url = url.strip()

		try:
			print(url.ljust(print_max_length), end="")

			driver.get(url)
		except Exception:  # Exception as e
			retry_urls.append(url)

			print(f" :: {BColours.FAIL}\u2716{BColours.ENDC}")  # print(e)
		else:
			if "colors" in url:
				defaults = handle_colors(driver, defaults)
			if "responsive-design" in url:
				defaults = handle_responsive_design(driver, defaults)
			if "font" in url or "letter" in url:
				defaults = handle_font_letter(driver, defaults, url)

			print(f" :: {BColours.OKBLUE}\u2714{BColours.ENDC}")
		finally:
			driver.close()
			driver.quit()

	return (defaults, retry_urls)


def main(output_path: str, driver_path: str, urls: list[str], defaults: T_DEFAULTS):
	get_url_defaults_count: int = 0
	retry_urls: list[str] = []

	while get_url_defaults_count == 0 or len(retry_urls) != 0:
		if get_url_defaults_count == 0:
			print_max_length = len(max(urls, key=lambda url: len(url)))
			(defaults, retry_urls) = get_url_defaults(defaults, driver_path, urls, print_max_length)
		elif get_url_defaults_count > 5:  # noqa: PLR2004
			print(f"--- {BColours.FAIL}more than {get_url_defaults_count} retries{BColours.ENDC} ---")
			defaults = {}

			break
		else:
			print(f"retry: {get_url_defaults_count}")
			print_max_length = len(max(retry_urls, key=lambda url: len(url)))
			(defaults, retry_urls) = get_url_defaults(defaults, driver_path, retry_urls, print_max_length)

		get_url_defaults_count += 1

	defaults_list_path: str = abs_path(output_path)
	with open(defaults_list_path, mode="w+", encoding="utf-8") as file:
		json_dump(defaults, file, indent="\t")

	# link defaults-list.json to "{ROOT_PATH}/generator-order-list/"
	# p: CompletedProcess[bytes] = process_run(
	# 	[
	# 		"ln",
	# 		"-frs",
	# 		abs_path([ROOT_PATH, "webscrape-tailwindcss", "defaults-list.json"]),
	# 		abs_path([ROOT_PATH, "generator-order-list", "defaults-list.json"]),
	# 	],
	# 	shell=IS_WINDOWS,
	# )
	# if p.returncode != 0:
	# 	print(f"{BColours.FAIL}--- failed linking defaults-list.json ---{BColours.ENDC}")
	# 	return


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]
	expected_paths = ["<OUTPUT_PATH>", "<DRIVER_PATH>"]
	if len(args) < len(expected_paths):
		print(f"{BColours.FAIL}python get-defaults.py {' '.join(expected_paths)}{BColours.ENDC}")
	else:
		output_path: str = abs_path(args[0] if args[0] != "" else "defaults-list.json")
		driver_path: str = abs_path(args[1] if args[1] != "" else "selenium-drivers/geckodriver")
		urls: list[str] = [
			"https://tailwindcss.com/docs/colors",
			"https://tailwindcss.com/docs/responsive-design",
			"https://tailwindcss.com/docs/font-size",
			"https://tailwindcss.com/docs/font-weight",
			"https://tailwindcss.com/docs/letter-spacing",
		]
		# fmt: off
		defaults: T_DEFAULTS = {
			# https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units
			"absolute-length-unit": ["cm", "in", "mm", "pc", "pt", "px", "Q"],
			"angle-unit": ["deg", "grad", "rad", "turn"],
			"default-viewport-unit": ["vb", "vh", "vi", "vmax", "vmin", "vw"],
			"dynamic-viewport-unit": ["dvb", "dvh", "dvi", "dvmax", "dvmin", "dvw"],
			"frequency-unit": ["Hz", "kHz"],
			"large-viewport-percentage-unit": ["lvb", "lvh", "lvi", "lvmax", "lvmin", "lvw"],
			"local-font-relative-length-unit": ["cap", "ch", "em", "ex", "ic", "lh"],
			"physical-unit": ["cm", "in", "mm", "pc", "pt", "Q"],
			"relative-length-unit": ["cap", "ch", "em", "ex", "ic", "lh", "rem", "rlh", "vb", "vh", "vi", "vmax", "vmin", "vw"],
			"resolution-unit": ["dpcm", "dpi", "dppx", "x"],
			"root-font-relative-length-unit": ["rcap", "rch", "rem", "rex", "ric", "rlh"],
			"small-viewport-percentage-unit": ["svb", "svh", "svi", "svmax", "svmin", "svw"],
			"time-unit": ["ms", "s"],
			"viewport-unit": ["dvh", "dvw", "lvh", "lvw", "svh", "svw", "vb", "vh", "vi", "vmax", "vmin", "vw"],
			"visual-angle-unit": ["px"],
			# https://github.com/tailwindlabs/tailwindcss/blob/v3.4.17/stubs/config.full.js#L605
			"line-height": ["none", "tight", "snug", "normal", "relaxed", "loose"],
			# https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/src/compat/colors.ts
			"colour-absolute": ["inherit", "current", "transparent", "black", "white"],
		}
		# fmt: on

		main(output_path, driver_path, urls, defaults)
