from json import dump
from json import load as json_load
from sys import argv
from time import sleep
from typing import cast

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from helper import T_DEFAULTS, T_STYLES, BColours, abs_path, init_webdriver


def get_class_names(td_elements: list[WebElement], defaults: T_DEFAULTS) -> list[str]:  # noqa: C901, PLR0912
	class_names: list[str] = [td.text for td in td_elements]
	set_like: dict[str, tuple[int | None, str]] = {}

	for i, class_name in enumerate(class_names):
		if "-<" in class_name:
			base_name = class_name.split("-<")[0]
			if "-<angle>" in class_name:
				class_names[i] = f"{base_name}-10deg"
			elif "-<color>" in class_name:
				# https://tailwindcss.com/docs/background-image
				if set_like.get(f"{base_name}", None) is None:
					set_like[base_name] = (i, "<color>")
			elif "-<number>" in class_name:
				class_names[i] = f"{base_name}-5"
			elif "-<percentage>" in class_name:
				class_names[i] = f"{base_name}-10%"
			elif "-<fraction>" in class_name or "-<ratio>" in class_name:
				class_names[i] = f"{base_name}-1/2"
			elif "-<size>/<number>" in class_name:
				# https://tailwindcss.com/docs/line-height
				if set_like.get(f"{base_name}", None) is None:
					set_like[base_name] = (i, "<size>/<number>")
			elif "-<size>/(<custom-property" in class_name:
				# https://tailwindcss.com/docs/line-height
				if set_like.get(f"{base_name}", None) is None:
					set_like[base_name] = (i, "<size>/(<custom-property>)")
			elif "-<size>/[<value" in class_name:
				# https://tailwindcss.com/docs/line-height
				if set_like.get(f"{base_name}", None) is None:
					set_like[base_name] = (i, "<size>/[<value>]")
			elif "-<custom-property" in class_name:
				class_names[i] = f"{base_name}-(<custom-property>)"
			elif "-<value" in class_name:
				class_names[i] = f"{base_name}-[<value>]"
	# add class names to [`-<color>`, `-<size>/<number>`]
	set_like_keys = list(set_like.keys())[::-1]
	for key in set_like_keys:
		classes_to_append: list[str] = []
		if set_like[key][1] == "<color>":
			for colour in defaults["colour-absolute"]:
				classes_to_append.append(f"{key}-{colour}")
			for colour in defaults["colour-relative"]:
				classes_to_append.append(f"{key}-{colour}-50")
		elif set_like[key][1] == "<size>/<number>":
			for text_size in defaults["font-size"]:
				classes_to_append.append(f"{key}-{text_size}/5")
		elif set_like[key][1] == "<size>/(<custom-property>)":
			for text_size in defaults["font-size"]:
				classes_to_append.append(f"{key}-{text_size}/(<custom-property>)")
		elif set_like[key][1] == "<size>/[<value>]":
			for text_size in defaults["font-size"]:
				classes_to_append.append(f"{key}-{text_size}/[<value>]")
		class_names = (
			class_names[: cast(int, set_like[key][0])]
			+ classes_to_append
			+ class_names[cast(int, set_like[key][0]) + 1 :]
		)

	return class_names


def main(driver_path: str | None, defaults: T_DEFAULTS, pages: list[str]):
	styles_dict: dict[str, T_STYLES] = {}

	### https://github.com/tailwindlabs/tailwindcss-typography ###
	styles_dict["tailwindcss-typography"] = {
		"regular": [
			"prose",
			"prose-sm",
			"prose-base",
			"prose-lg",
			"prose-xl",
			"prose-2xl",
			"prose-gray",
			"prose-slate",
			"prose-zinc",
			"prose-neutral",
			"prose-stone",
		],
		"custom": [],
	}
	### https://github.com/tailwindlabs/tailwindcss-forms ###
	styles_dict["tailwindcss-forms"] = {
		"regular": [
			"form-input",
			"form-textarea",
			"form-select",
			"form-multiselect",
			"form-checkbox",
			"form-radio",
		],
		"custom": [],
	}

	# --------------------------------------------------------------------------------------------------------
	# set new driver instance each iteration because driver.get(url) doesn't work in subsequent loop iteration
	# --------------------------------------------------------------------------------------------------------
	for page in pages:
		driver = init_webdriver(driver_path)
		page = page.strip()

		try:
			driver.get(page)
		except Exception as e:
			print(e)
			break
		else:
			print(driver.current_url)

			# Allows for pages with and without "Show more" button
			sleep(0.2)
			button_elements: list[WebElement] = driver.find_elements(By.TAG_NAME, "button")
			sleep(0.2)
			button_elements_filtered: filter[WebElement] = filter(
				lambda x: x.text.strip().upper() == "SHOW MORE", button_elements
			)
			sleep(0.2)
			for button in button_elements_filtered:
				button.click()
			sleep(0.2)
			td_elements = driver.find_elements(
				By.CSS_SELECTOR,
				"#quick-reference tbody tr td:first-child",
			)
			class_names: list[str] = get_class_names(td_elements, defaults)
			regular_classes = filter(
				lambda x: "-(" not in x and "-[" not in x and "/(" not in x and "/[" not in x, class_names
			)
			custom_classes = filter(lambda x: "-(" in x or "-[" in x or "/(" in x or "/[" in x, class_names)
			dict_key: str = page.split("/")[-1]
			if dict_key in styles_dict:
				print(f"{BColours.FAIL}DUPLICATE KEY: {dict_key}{BColours.ENDC}")
			styles_dict[dict_key] = {
				"regular": list(regular_classes),
				"custom": list(custom_classes),
			}
		finally:
			driver.close()
			driver.quit()

	### --- SPECIAL CASES :: START --- ###
	# https://github.com/tailwindlabs/tailwindcss/pull/17378
	# https://tailwindcss.com/docs/background-position
	if "background-position" in styles_dict:
		styles_dict["background-position"]["regular"].extend(
			["bg-left-bottom", "bg-left-top", "bg-right-bottom", "bg-right-top"]
		)
	# https://github.com/tailwindlabs/tailwindcss/pull/17437
	# https://tailwindcss.com/docs/object-position
	if "object-position" in styles_dict:
		styles_dict["object-position"]["regular"].extend(
			["object-left-bottom", "object-left-top", "object-right-bottom", "object-right-top"]
		)
	### --- SPECIAL CASES :: END --- ###

	styles_list_path: str = abs_path("styles-list.json")
	with open(styles_list_path, mode="w+", encoding="utf-8") as file:
		dump(styles_dict, file, indent="\t")


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]
	if len(args) == 0:
		print(f"{BColours.FAIL}python get-styles.py [DRIVER_PATH]{BColours.ENDC}")
	else:
		driver_path: str = abs_path(args[0])
		pages_path: str = abs_path("pages.txt")
		with open(pages_path, mode="r", encoding="utf-8") as file:
			pages: list[str] = file.readlines()
		defaults_path: str = abs_path("defaults-list.json")
		with open(defaults_path, mode="r", encoding="utf-8") as file:
			defaults = cast(T_DEFAULTS, json_load(file))

		main(driver_path, defaults, pages)
