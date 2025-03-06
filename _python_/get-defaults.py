from json import dump
from sys import argv
from time import sleep

from selenium.webdriver import Firefox
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from webdriver_manager.firefox import GeckoDriverManager

from helper import abs_path, t_default_keys


def main(driver_path: str | None):
	driver: WebDriver
	driver_options = Options()
	driver_options.add_argument("-headless")

	defaults: dict[t_default_keys, list[str]] = {}
	defaults["angle-unit"] = ["deg", "grad", "rad", "turn"]
	defaults["colour-absolute"] = ["inherit", "current", "transparent", "black", "white"]

	urls: list[str] = ["https://tailwindcss.com/docs/colors", "https://tailwindcss.com/docs/font-size"]

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
			if "colors" in url:
				parent_element: WebElement = driver.find_element(
					By.CSS_SELECTOR, ".not-prose.grid.grid-cols-\\[auto_minmax\\(0\\,_1fr\\)\\].items-center.gap-4"
				)
				sleep(0.1)
				defaults["colour-relative"] = [
					f"{p.text.strip().lower()}" for p in parent_element.find_elements(By.TAG_NAME, "p")
				]

			if "font-size" in url:
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
				class_names = [td.text.lower().split("text-")[1] for td in td_elements]
				defaults["text-size"] = list(filter(lambda x: "(" not in x and "[" not in x, class_names))

		# try: driver.get(url.strip())
		finally:
			driver.close()
			driver.quit()

	defaults_list_path: str = abs_path("defaults-list.json")
	with open(defaults_list_path, mode="w+", encoding="utf-8") as file:
		dump(defaults, file, indent="\t")


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]

	if len(args) == 0:
		print("--- --- --- args error --- --- ---")
		print("python get_styles.py [DRIVER_PATH]")
	else:
		driver_path: str = abs_path(args[0])
		main(driver_path)
