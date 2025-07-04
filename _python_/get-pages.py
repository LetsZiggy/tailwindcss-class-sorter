from itertools import chain
from sys import argv

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from helper import BColours, abs_path, init_webdriver


def main(driver_path: str | None, url: str):
	driver = init_webdriver(driver_path)
	url = url.strip()

	try:
		driver.get(url)
	except Exception as e:
		print(e)
		return
	else:
		excluded_groups: list[str] = ["GETTING STARTED", "CORE CONCEPTS", "BASE STYLES"]
		group_elements: list[WebElement] = driver.find_elements(
			By.CSS_SELECTOR, "nav.flex.flex-col.gap-8 div.flex.flex-col.gap-3"
		)
		group_elements_filtered: filter[WebElement] = filter(
			lambda x: x.find_element(By.TAG_NAME, "h3").text.upper() not in excluded_groups,  # pyright: ignore[reportUnknownMemberType]
			group_elements,
		)
		anchor_elements: chain[WebElement] = chain.from_iterable(
			[filtered.find_elements(By.TAG_NAME, "a") for filtered in group_elements_filtered]  # pyright: ignore[reportUnknownMemberType]
		)
		pages_path: str = abs_path("pages.txt")
		with open(pages_path, mode="w+", encoding="utf-8") as file:
			links: list[str] = [f"{str(anchor.get_attribute('href'))}\n" for anchor in anchor_elements]  # pyright: ignore[reportUnknownMemberType]
			file.writelines(links)
	finally:
		driver.close()
		driver.quit()


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]
	if len(args) == 0:
		print(f"{BColours.FAIL}python get-pages.py [DRIVER_PATH]{BColours.ENDC}")
	else:
		driver_path: str = abs_path(args[0])
		url: str = "https://tailwindcss.com/docs/preflight"

		main(driver_path, url)
