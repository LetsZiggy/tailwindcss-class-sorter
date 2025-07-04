from json import load as json_load
from re import Match, Pattern
from re import compile as re_compile
from typing import cast

from helper import ROOT_PATH, T_DEFAULTS, T_STYLES, abs_path


def main(defaults: T_DEFAULTS, styles: dict[str, T_STYLES]):
	colours: list[str] = [f"(?:-{colour})" for colour in (defaults["colour-absolute"] + defaults["colour-relative"])]
	colours_regex: Pattern[str] = re_compile("|".join(colours))
	colours_gradient_absolute: list[str] = [f"(?:-{colour}-\\d{{2,3}})" for colour in defaults["colour-absolute"]]
	colours_gradient_absolute_regex: Pattern[str] = re_compile("|".join(colours_gradient_absolute))
	colours_gradient_relative: list[str] = [f"(?:-{colour}-\\d{{2,3}})" for colour in defaults["colour-relative"]]
	colours_gradient_relative_regex: Pattern[str] = re_compile("|".join(colours_gradient_relative))
	gradient_opacity_regex: Pattern[str] = re_compile(r"-\d+/")
	styles_keys: dict[str, None] = {}

	for key in styles:
		m: Match[str] | None
		i: int

		for style in styles[key]["regular"]:
			if key not in ["tailwindcss-typography", "font-weight", "backdrop-filter-grayscale"]:
				m = colours_regex.search(style)
				if m is not None:
					style_gradient = f"{style}/100"
					style_gradient = gradient_opacity_regex.sub("-50/", style_gradient)
					styles_keys[style_gradient] = None

			m = colours_gradient_absolute_regex.search(style)
			if m is not None:
				i = style.rfind("-")
				style = f"{style[:i]}-50"

			m = colours_gradient_relative_regex.search(style)
			if m is not None:
				i = style.rfind("-")
				style = f"{style[:i]}-50"

			styles_keys[style] = None

	with open(abs_path([ROOT_PATH, "_nodejs_", "safelist.txt"]), mode="w+", encoding="utf-8") as file:
		file.writelines("\n".join(styles_keys.keys()))
	# with open(abs_path([ROOT_PATH, "order_list_generator", "safelist.txt"]), mode="w+", encoding="utf-8") as file:
	# 	file.writelines("\n".join(styles.keys()))


if __name__ == "__main__":
	defaults_path: str = abs_path("defaults-list.json")
	with open(defaults_path, mode="r", encoding="utf-8") as file:
		defaults = cast(T_DEFAULTS, json_load(file))
	styles_path: str = abs_path("styles-list.json")
	with open(styles_path, mode="r", encoding="utf-8") as file:
		styles = cast(dict[str, T_STYLES], json_load(file))

	main(defaults, styles)
