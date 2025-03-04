from json import dump
from os import path
from sys import argv
from time import sleep

from selenium.webdriver import Firefox
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from webdriver_manager.firefox import GeckoDriverManager


def main(driver_path: str | None):
	class_dict: dict[str, tuple[list[str], list[str]]] = {}
	pages: list[str] = []
	pages_path: str = path.abspath(path.expanduser(path.normpath("pages.txt")))
	with open(pages_path, mode="r", encoding="utf-8") as file:
		pages = file.readlines()

	driver: WebDriver
	driver_options = Options()
	driver_options.add_argument("-headless")

	# --------------------------------------------------------------------------------------------------------
	# set new driver instance each iteration because driver.get(url) doesn't work in subsequent loop iteration
	# --------------------------------------------------------------------------------------------------------
	for page in pages:
		# https://github.com/mozilla/geckodriver/releases
		if driver_path is None:
			driver = Firefox(service=Service(GeckoDriverManager().install()), options=driver_options)
		else:
			driver = Firefox(service=Service(driver_path), options=driver_options)

		try:
			driver.get(page.strip())
		except Exception as e:
			print(e)
			break
		else:
			print(driver.current_url)

			# Allows for pages with and without "Show more" button
			button_elements: list[WebElement] = driver.find_elements(By.TAG_NAME, "button")
			sleep(0.5)
			button_elements_filtered: filter[WebElement] = filter(
				lambda x: x.text.upper() == "SHOW MORE", button_elements
			)
			for button in button_elements_filtered:
				button.click()

			key: str = driver.current_url.split("/")[-1]
			td_elements = driver.find_elements(
				By.CSS_SELECTOR,
				"#quick-reference tbody tr td.text-sky-500.dark\\:text-sky-400",
			)
			class_names = [td.text for td in td_elements]

			for i, class_name in enumerate(class_names):
				if "-<" in class_name:
					base_name = class_name.split("-<")[0]

					if "-<number>" in class_name:
						class_names[i] = f"{base_name}-5"
					elif "-<ratio>" in class_name or "-<fraction>" in class_name:
						class_names[i] = f"{base_name}-1/2"

			regular_classes = filter(lambda x: "-(" not in x and "-[" not in x, class_names)
			custom_classes = filter(lambda x: "-(" in x or "-[" in x, class_names)
			class_dict[key] = (list(regular_classes), list(custom_classes))

			print(class_dict[key])
			print()

			sleep(0.5)

		# try: driver.get(page.strip())
		finally:
			driver.close()
			driver.quit()

	styles_list_path: str = path.abspath(path.expanduser(path.normpath("styles_list.json")))
	with open(styles_list_path, mode="w+", encoding="utf-8") as file:
		dump(class_dict, file, indent="\t")


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]

	if len(args) == 0:
		print("--- --- --- args error --- --- ---")
		print("python get_styles.py [DRIVER_PATH]")
	else:
		driver_path: str = path.abspath(path.expanduser(path.normpath(args[0])))
		main(driver_path)
