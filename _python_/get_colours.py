from json import dump
from os import path
from sys import argv
from typing import Literal

from selenium.webdriver import Firefox
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from webdriver_manager.firefox import GeckoDriverManager


def main(driver_path: str | None):
	driver: WebDriver
	driver_options = Options()
	driver_options.add_argument("-headless")
	# https://github.com/mozilla/geckodriver/releases
	if driver_path is None:
		driver = Firefox(service=Service(GeckoDriverManager().install()), options=driver_options)
	else:
		driver = Firefox(service=Service(driver_path), options=driver_options)

	try:
		driver.get("https://tailwindcss.com/docs/colors")
	except Exception as e:
		print(e)
		return
	else:
		parent_element: WebElement = driver.find_element(
			By.CSS_SELECTOR, ".not-prose.grid.grid-cols-\\[auto_minmax\\(0\\,_1fr\\)\\].items-center.gap-4"
		)
		colours: dict[Literal["absolute", "relative"], list[str]] = {
			"absolute": ["inherit", "current", "transparent", "black", "white"]
		}
		colours["relative"] = [f"{p.text.strip().lower()}" for p in parent_element.find_elements(By.TAG_NAME, "p")]

		colours_list_path: str = path.abspath(path.expanduser(path.normpath("colours_list.json")))
		with open(colours_list_path, mode="w+", encoding="utf-8") as file:
			dump(colours, file, indent="\t")

	# try: driver.get("https://tailwindcss.com/docs/colors")
	finally:
		driver.close()
		driver.quit()


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]

	if len(args) == 0:
		print("--- --- --- args error --- --- ---")
		print("python get_styles.py [DRIVER_PATH]")
	else:
		driver_path: str = path.abspath(path.expanduser(path.normpath(args[0])))
		main(driver_path)
