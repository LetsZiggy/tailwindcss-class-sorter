from itertools import chain
from sys import argv

from selenium.webdriver import Firefox
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from webdriver_manager.firefox import GeckoDriverManager

from helper import BColours, abs_path


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
		driver.get("https://tailwindcss.com/docs/preflight")
	except Exception as e:
		print(e)
		return
	else:
		excluded_groups: list[str] = ["GETTING STARTED", "CORE CONCEPTS", "BASE STYLES"]
		group_elements: list[WebElement] = driver.find_elements(
			By.CSS_SELECTOR, "nav.flex.flex-col.gap-8 div.flex.flex-col.gap-3"
		)
		group_elements_filtered: filter[WebElement] = filter(
			lambda x: x.find_element(By.TAG_NAME, "h3").text.upper() not in excluded_groups, group_elements
		)
		anchor_elements: chain[WebElement] = chain.from_iterable(
			[filtered.find_elements(By.TAG_NAME, "a") for filtered in group_elements_filtered]
		)
		pages_path: str = abs_path("pages.txt")
		with open(pages_path, mode="w+", encoding="utf-8") as file:
			links: list[str] = [f"{str(anchor.get_attribute('href'))}\n" for anchor in anchor_elements]
			file.writelines(links)
	# try: driver.get("https://tailwindcss.com/docs/preflight")
	finally:
		driver.close()
		driver.quit()


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]
	if len(args) == 0:
		print(f"{BColours.FAIL}python get-pages.py [DRIVER_PATH]{BColours.ENDC}")
	else:
		driver_path: str = abs_path(args[0])
		main(driver_path)
