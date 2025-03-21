from json import load as json_load
from re import Match, Pattern
from re import compile as re_compile
from subprocess import PIPE, CompletedProcess
from subprocess import run as process_run

from helper import IS_WINDOWS, BColours, abs_path, t_default_keys, t_styles_keys


def main():
	styles_list_path: str = abs_path("styles-list.json")
	with open(styles_list_path, mode="r", encoding="utf-8") as file:
		styles_list: dict[str, dict[t_styles_keys, list[str]]] = json_load(file)

	defaults_list_path: str = abs_path("defaults-list.json")
	with open(defaults_list_path, mode="r", encoding="utf-8") as file:
		defaults_list: dict[t_default_keys, list[str]] = json_load(file)

	colours: list[str] = [
		f"(?:-{colour})" for colour in (defaults_list["colour-absolute"] + defaults_list["colour-relative"])
	]
	colours_regex: Pattern[str] = re_compile("|".join(colours))
	colours_gradient_absolute: list[str] = [f"(?:-{colour}-\\d{{2,3}})" for colour in defaults_list["colour-absolute"]]
	colours_gradient_absolute_regex: Pattern[str] = re_compile("|".join(colours_gradient_absolute))
	colours_gradient_relative: list[str] = [f"(?:-{colour}-\\d{{2,3}})" for colour in defaults_list["colour-relative"]]
	colours_gradient_relative_regex: Pattern[str] = re_compile("|".join(colours_gradient_relative))
	gradient_opacity_regex: Pattern[str] = re_compile(r"-\d+/")
	styles: dict[str, None] = {}

	for key in styles_list:
		m: Match[str] | None
		i: int

		for style in styles_list[key]["regular"]:
			if key not in ["tailwindcss-typography", "font-weight", "backdrop-filter-grayscale"]:
				m = colours_regex.search(style)
				if m is not None:
					style_gradient = f"{style}/100"
					style_gradient = gradient_opacity_regex.sub("-50/", style_gradient)

					styles[style_gradient] = None

			m = colours_gradient_absolute_regex.search(style)
			if m is not None:
				i = style.rfind("-")
				style = f"{style[:i]}-50"

			m = colours_gradient_relative_regex.search(style)
			if m is not None:
				i = style.rfind("-")
				style = f"{style[:i]}-50"

			styles[style] = None

	p: CompletedProcess[bytes] = process_run(
		["git", "rev-parse", "--show-toplevel"], stderr=PIPE, stdout=PIPE, shell=IS_WINDOWS
	)
	if p.returncode != 0:
		print(f"{BColours.FAIL}--- failed to get root_path ---{BColours.ENDC}")
		return
	root_path: str = p.stdout.decode("UTF-8").strip()
	with open(abs_path([root_path, "_nodejs_", "safelist.txt"]), mode="w+", encoding="utf-8") as file:
		file.writelines("\n".join(styles.keys()))


if __name__ == "__main__":
	main()
