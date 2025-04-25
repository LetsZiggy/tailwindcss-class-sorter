from itertools import batched, chain
from json import dump as json_dump
from json import load as json_load
from sys import argv
from time import sleep
from typing import Literal, cast

from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from helper import T_ADDITIONAL_CLASSES, T_DEFAULTS, T_STYLES, BColours, abs_path, dedup_list, init_webdriver


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
				if set_like.get(f"{base_name}", None) is None:  # noqa: SIM910
					set_like[base_name] = (i, "<color>")
			elif "-<number>" in class_name:
				class_names[i] = f"{base_name}-5"
			elif "-<percentage>" in class_name:
				class_names[i] = f"{base_name}-10%"
			elif "-<fraction>" in class_name or "-<ratio>" in class_name:
				class_names[i] = f"{base_name}-1/2"
			elif "-<size>/<number>" in class_name:
				# https://tailwindcss.com/docs/line-height
				if set_like.get(f"{base_name}", None) is None:  # noqa: SIM910
					set_like[base_name] = (i, "<size>/<number>")
			elif "-<size>/(<custom-property" in class_name:
				# https://tailwindcss.com/docs/line-height
				if set_like.get(f"{base_name}", None) is None:  # noqa: SIM910
					set_like[base_name] = (i, "<size>/(<custom-property>)")
			elif "-<size>/[<value" in class_name:
				# https://tailwindcss.com/docs/line-height
				if set_like.get(f"{base_name}", None) is None:  # noqa: SIM910
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
				# other colours to be added in generator.js
				if colour == "white":
					classes_to_append.append(f"{key}-{colour}")
			for colour in defaults["colour-relative"]:
				# other colours to be added in generator.js
				if colour == "red":
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


def get_url_styles(  # noqa: PLR0913
	styles_dict: dict[str, T_STYLES],
	driver_path: str,
	urls: list[str],
	defaults: T_DEFAULTS,
	colours_to_remove: list[str],
	print_max_length: int,
) -> tuple[dict[str, T_STYLES], list[str]]:
	retry_urls: list[str] = []

	# --------------------------------------------------------------------------------------------------------
	# set new driver instance each iteration because driver.get(url) doesn't work in subsequent loop iteration
	# --------------------------------------------------------------------------------------------------------
	for url in urls:
		driver = init_webdriver(driver_path)
		driver.implicitly_wait(30)
		url = url.strip()
		dict_key: str = url.split("/")[-1]

		try:
			print(url.ljust(print_max_length), end="")

			driver.get(url)
		except Exception:  # Exception as e
			retry_urls.append(url)
			styles_dict[dict_key] = {
				"regular": [],
				"custom": [],
			}

			print(f" :: {BColours.FAIL}\u2716{BColours.ENDC}")  # print(e)
		else:
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
			class_names: list[str] = get_class_names(td_elements, defaults)
			regular_classes = list(
				filter(lambda x: "-(" not in x and "-[" not in x and "/(" not in x and "/[" not in x, class_names)
			)
			# ensure order: "custom": ["...-(<custom-property>)", "...-[<value>]"]
			custom_classes = list(
				chain.from_iterable(
					[
						sorted(batched_classes)
						for batched_classes in batched(
							filter(lambda x: "-(" in x or "-[" in x or "/(" in x or "/[" in x, class_names),
							2,
						)
					]
				)
			)
			if dict_key in styles_dict and (
				len(styles_dict[dict_key].get("regular", [])) != 0 or len(styles_dict[dict_key].get("custom", [])) != 0
			):
				print(f"{BColours.FAIL}DUPLICATE KEY: {dict_key}{BColours.ENDC}")

			# check if classes has colour range (eg *-black, *-white, *-blue-*, *-red-*)
			has_colour_range: dict[Literal["absolute", "relative"], bool] = {"absolute": False, "relative": False}
			for class_name in regular_classes:
				if "-white" in class_name:
					has_colour_range["absolute"] = True
				if "-red-" in class_name:
					has_colour_range["relative"] = True
				if (has_colour_range["absolute"] is True) and (has_colour_range["relative"] is True):
					break

			# remove colours except "*-white" and "*-red-*"
			# remove excess red colour steps (eg *-red-100 >>> *-red-950)
			if (has_colour_range["absolute"] is True) and (has_colour_range["relative"] is True):
				# remove colours except "*-white" and "*-red-*"
				regular_classes = list(
					filter(
						lambda class_name: not any(colour in class_name for colour in colours_to_remove),
						regular_classes,
					)
				)

				# remove excess red colour steps (eg *-red-100 >>> *-red-950)
				regular_classes = list(
					filter(
						lambda class_name: ("-red-" not in class_name) or (class_name.endswith("-50")),
						regular_classes,
					)
				)

			styles_dict[dict_key] = {
				"regular": regular_classes,
				"custom": custom_classes,
			}

			print(f" :: {BColours.OKBLUE}\u2714{BColours.ENDC}")
		finally:
			driver.close()
			driver.quit()

	return (styles_dict, retry_urls)


def main(
	output_path: str, driver_path: str, urls: list[str], defaults: T_DEFAULTS, additional_classes: T_ADDITIONAL_CLASSES
):
	get_url_styles_count: int = 0
	retry_urls: list[str] = []
	styles_dict: dict[str, T_STYLES] = {
		pk: {sk: sv for (sk, sv) in pv.items() if sk != "links"}
		for (pk, pv) in additional_classes.get("3rd-party", {}).items()
	}
	colours_to_remove = [
		*(f"-{colour}" for colour in filter(lambda colour_: colour_ != "white", defaults["colour-absolute"])),
		*(f"-{colour}-" for colour in filter(lambda colour_: colour_ != "red", defaults["colour-relative"])),
	]

	while get_url_styles_count == 0 or len(retry_urls) != 0:
		if get_url_styles_count == 0:
			print_max_length = len(max(urls, key=lambda url: len(url)))
			(styles_dict, retry_urls) = get_url_styles(
				styles_dict, driver_path, urls, defaults, colours_to_remove, print_max_length
			)
		elif get_url_styles_count > 5:  # noqa: PLR2004
			print(f"--- {BColours.FAIL}more than {get_url_styles_count} retries{BColours.ENDC} ---")
			styles_dict = {
				pk: {sk: sv for (sk, sv) in pv.items() if sk != "links"}
				for (pk, pv) in additional_classes.get("3rd-party", {}).items()
			}

			break
		else:
			print(f"retry: {get_url_styles_count}")
			print_max_length = len(max(retry_urls, key=lambda url: len(url)))
			(styles_dict, retry_urls) = get_url_styles(
				styles_dict, driver_path, retry_urls, defaults, colours_to_remove, print_max_length
			)

		get_url_styles_count += 1

	# add deprecated classes
	deprecated_classes = {
		pk: {sk: sv for (sk, sv) in pv.items() if sk != "links"}
		for (pk, pv) in additional_classes.get("deprecated", {}).items()
	}

	for deprecated_class_key in deprecated_classes:
		if deprecated_class_key in styles_dict:
			styles_dict[deprecated_class_key]["regular"] = dedup_list(
				[
					*styles_dict.get(deprecated_class_key, {"regular": []}).get("regular", []),
					*deprecated_classes.get(deprecated_class_key, {"regular": []}).get("regular", []),
				]
			)
			styles_dict[deprecated_class_key]["custom"] = dedup_list(
				[
					*styles_dict.get(deprecated_class_key, {"custom": []}).get("custom", []),
					*deprecated_classes.get(deprecated_class_key, {"custom": []}).get("custom", []),
				]
			)

	styles_list_path: str = abs_path(output_path)
	with open(styles_list_path, mode="w+", encoding="utf-8") as file:
		json_dump(styles_dict, file, indent="\t")


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]
	expected_paths = ["<OUTPUT_PATH>", "<DRIVER_PATH>", "<URLS_PATH>", "<DEFAULTS_PATH>", "<ADDITIONAL_CLASSES_PATH>"]
	if len(args) < len(expected_paths):
		print(f"{BColours.FAIL}python get-styles.py {' '.join(expected_paths)}{BColours.ENDC}")
	else:
		output_path: str = abs_path(args[0] if args[0] != "" else "styles-list.json")
		driver_path: str = abs_path(args[1] if args[1] != "" else "selenium-drivers/geckodriver")
		urls_path: str = abs_path(args[2] if args[2] != "" else "urls.txt")
		with open(urls_path, mode="r", encoding="utf-8") as file:
			urls: list[str] = file.readlines()
		defaults_path: str = abs_path(args[3] if args[3] != "" else "defaults-list.json")
		with open(defaults_path, mode="r", encoding="utf-8") as file:
			defaults = cast(T_DEFAULTS, json_load(file))
		additional_classes_path: str = abs_path(args[4] if args[4] != "" else "additional-classes-list.json")
		with open(additional_classes_path, mode="r", encoding="utf-8") as file:
			additional_classes = cast(T_ADDITIONAL_CLASSES, json_load(file))

		main(output_path, driver_path, urls, defaults, additional_classes)
