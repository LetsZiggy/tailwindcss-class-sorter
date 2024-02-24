from itertools import chain
from sys import argv

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from helper import BColours, abs_path, init_webdriver


def get_urls(driver_path: str, url: str, excluded_groups: list[str]) -> list[str]:
	urls: list[str] = []
	driver = init_webdriver(driver_path)
	driver.implicitly_wait(30)
	url = url.strip()

	try:
		print(url, end="")

		driver.get(url)
	except Exception:  # Exception as e
		print(f" :: {BColours.FAIL}\u2716{BColours.ENDC}")  # print(e)
	else:
		group_elements: list[WebElement] = driver.find_elements(
			By.CSS_SELECTOR, "nav.flex.flex-col.gap-8 div.flex.flex-col.gap-3"
		)
		group_elements_filtered: filter[WebElement] = filter(
			lambda x: x.find_element(By.TAG_NAME, "h3").text.upper() not in excluded_groups,
			group_elements,
		)
		anchor_elements: chain[WebElement] = chain.from_iterable(
			[filtered.find_elements(By.TAG_NAME, "a") for filtered in group_elements_filtered]
		)
		urls = [str(anchor.get_attribute("href")) for anchor in anchor_elements]  # pyright: ignore[reportUnknownMemberType]

		print(f" :: {BColours.OKBLUE}\u2714{BColours.ENDC}")
	finally:
		driver.close()
		driver.quit()

	return urls


def main(output_path: str, driver_path: str, url: str):
	excluded_groups: list[str] = ["GETTING STARTED", "CORE CONCEPTS", "BASE STYLES"]
	urls: list[str] = []

	while len(urls) == 0:
		urls = get_urls(driver_path, url, excluded_groups)

	urls_txt_path: str = abs_path(output_path)
	with open(urls_txt_path, mode="w+", encoding="utf-8") as file:
		file.writelines("\n".join(urls))


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]
	expected_paths = ["<OUTPUT_PATH>", "<DRIVER_PATH>"]
	if len(args) < len(expected_paths):
		print(f"{BColours.FAIL}python get-urls.py {' '.join(expected_paths)}{BColours.ENDC}")
	else:
		output_path: str = abs_path(args[0] if args[0] != "" else "urls.txt")
		driver_path: str = abs_path(args[1] if args[1] != "" else "selenium-drivers/geckodriver")
		url: str = "https://tailwindcss.com/docs/preflight"

		main(output_path, driver_path, url)
