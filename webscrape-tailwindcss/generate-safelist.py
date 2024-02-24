from json import load as json_load
from re import Match, Pattern
from re import compile as re_compile
from sys import argv
from typing import cast

from helper import SKIP_STYLES_GROUPS_COLOUR_REMOVE, T_DEFAULTS, T_STYLES, BColours, abs_path


def main(output_path: str, defaults: T_DEFAULTS, styles: dict[str, T_STYLES]):  # noqa: C901
	# colours allowed: white (absolute) | red (relative)
	colours_allowed_regex: Pattern[str] = re_compile("(?:-white)|(?:-red-)")
	custom_property_regex: Pattern[str] = re_compile(r"-\([^)]+?\)")
	custom_value_regex: Pattern[str] = re_compile(r"-\[[^\]]+?\]")
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
			# colours allowed: white (absolute) | red (relative)
			if key not in SKIP_STYLES_GROUPS_COLOUR_REMOVE:
				m = colours_regex.search(style)
				if m is not None:
					allowed_colour = colours_allowed_regex.search(style)
					if allowed_colour is None:
						continue

			if key not in SKIP_STYLES_GROUPS_COLOUR_REMOVE:
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

		for style in styles[key]["custom"]:
			if custom_property_regex.search(style) is not None:
				style = custom_property_regex.sub("-(--custom-property-placeholder)", style)
			if custom_value_regex.search(style) is not None:
				style = custom_value_regex.sub("-[--value-placeholder]", style)

			styles_keys[style] = None

	with open(abs_path(output_path), mode="w+", encoding="utf-8") as file:
		file.writelines("\n".join(styles_keys.keys()))


if __name__ == "__main__":
	args: list[str] = [arg for arg in argv[1:] if not arg.startswith("-")]
	expected_paths = ["<OUTPUT_PATH>", "<DEFAULTS_PATH>", "<STYLES_PATH>"]
	if len(args) < len(expected_paths):
		print(f"{BColours.FAIL}python get-styles.py {' '.join(expected_paths)}{BColours.ENDC}")
	else:
		output_path: str = abs_path(args[0] if args[0] != "" else "../generator-order-list/safelist.txt")
		defaults_path: str = abs_path(args[1] if args[1] != "" else "defaults-list.json")
		with open(defaults_path, mode="r", encoding="utf-8") as file:
			defaults = cast(T_DEFAULTS, json_load(file))
		styles_path: str = abs_path(args[2] if args[2] != "" else "styles-list.json")
		with open(styles_path, mode="r", encoding="utf-8") as file:
			styles = cast(dict[str, T_STYLES], json_load(file))

		main(output_path, defaults, styles)
