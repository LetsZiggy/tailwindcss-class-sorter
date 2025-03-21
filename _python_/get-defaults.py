from json import dump
from subprocess import PIPE, CompletedProcess
from subprocess import run as process_run
from sys import argv
from time import sleep

from selenium.webdriver import Firefox
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from webdriver_manager.firefox import GeckoDriverManager

from helper import IS_WINDOWS, BColours, abs_path, t_default_keys


def main(driver_path: str | None):
	driver: WebDriver
	driver_options = Options()
	driver_options.add_argument("-headless")
	defaults: dict[t_default_keys, list[str]] = {}
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
	urls: list[str] = [
		"https://tailwindcss.com/docs/colors",
		"https://tailwindcss.com/docs/responsive-design",
		"https://tailwindcss.com/docs/font-size",
		"https://tailwindcss.com/docs/font-weight",
		"https://tailwindcss.com/docs/letter-spacing",
	]

	# --------------------------------------------------------------------------------------------------------
	# set new driver instance each iteration because driver.get(url) doesn't work in subsequent loop iteration
	# --------------------------------------------------------------------------------------------------------
	for url in urls:
		# https://github.com/mozilla/geckodriver/releases
		if driver_path is None:
			driver = Firefox(service=Service(GeckoDriverManager().install()), options=driver_options)
		else:
			driver = Firefox(service=Service(driver_path), options=driver_options)

		try:
			driver.get(url.strip())
		except Exception as e:
			print(e)
			break
		else:
			print(driver.current_url)

			if "colors" in url:
				parent_element: WebElement = driver.find_element(
					By.CSS_SELECTOR, ".not-prose.grid.grid-cols-\\[auto_minmax\\(0\\,_1fr\\)\\].items-center.gap-4"
				)
				sleep(0.1)
				defaults["colour-relative"] = [
					f"{p.text.strip().lower()}" for p in parent_element.find_elements(By.TAG_NAME, "p")
				]

			if "responsive-design" in url:
				table_elements: list[WebElement] = driver.find_elements(By.TAG_NAME, "table")
				sleep(0.1)
				table_elements_filtered: filter[WebElement] = filter(
					lambda x: "BREAKPOINT"
					in x.find_element(By.CSS_SELECTOR, "thead tr th:first-child").text.strip().upper(),
					table_elements,
				)
				sleep(0.1)
				table_element: WebElement = list(table_elements_filtered)[0]
				screen_elements: list[WebElement] = table_element.find_elements(
					By.CSS_SELECTOR, "tbody tr td:first-child code"
				)
				sleep(0.1)
				defaults["screen-size"] = ["xs"] + list(map(lambda x: x.text.strip().lower(), screen_elements))

			if "font" in url.strip() or "letter" in url.strip():
				# Allows for pages with and without "Show more" button
				button_elements: list[WebElement] = driver.find_elements(By.TAG_NAME, "button")
				sleep(0.1)
				button_elements_filtered: filter[WebElement] = filter(
					lambda x: x.text.upper() == "SHOW MORE", button_elements
				)
				sleep(0.1)
				for button in button_elements_filtered:
					button.click()
				sleep(0.1)
				td_elements = driver.find_elements(
					By.CSS_SELECTOR,
					"#quick-reference tbody tr td.text-sky-500.dark\\:text-sky-400",
				)
				if "font-size" in url.strip():
					class_names = [td.text.lower().split("text-")[1] for td in td_elements]
					defaults["font-size"] = list(filter(lambda x: "(" not in x and "[" not in x, class_names))
				if "font-weight" in url.strip():
					class_names = [td.text.lower().split("font-")[1] for td in td_elements]
					defaults["font-weight"] = list(filter(lambda x: "(" not in x and "[" not in x, class_names))
				if "letter-spacing" in url.strip():
					class_names = [td.text.lower().split("tracking-")[1] for td in td_elements]
					defaults["letter-spacing"] = list(filter(lambda x: "(" not in x and "[" not in x, class_names))
		# try: driver.get(url.strip())
		finally:
			driver.close()
			driver.quit()

	defaults_list_path: str = abs_path("defaults-list.json")
	with open(defaults_list_path, mode="w+", encoding="utf-8") as file:
		dump(defaults, file, indent="\t")
	p: CompletedProcess[bytes] = process_run(
		["git", "rev-parse", "--show-toplevel"], stderr=PIPE, stdout=PIPE, shell=IS_WINDOWS
	)
	if p.returncode != 0:
		print(f"{BColours.FAIL}--- failed to get root_path ---{BColours.ENDC}")
		return
	root_path: str = p.stdout.decode("UTF-8").strip()
	p = process_run(
		["ln", "-frs", f"{root_path}/_python_/defaults-list.json", f"{root_path}/_nodejs_/defaults-list.json"],
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
		main(driver_path)
