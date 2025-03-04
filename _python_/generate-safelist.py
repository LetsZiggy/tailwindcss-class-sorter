from json import load as json_load
from os import path
from typing import Literal


def main():
	styles_list_path: str = path.abspath(path.expanduser(path.normpath("styles_list.json")))
	with open(styles_list_path, mode="r", encoding="utf-8") as file:
		styles: dict[str, tuple[list[str], list[str]]] = json_load(file)

	colours_list_path: str = path.abspath(path.expanduser(path.normpath("colours_list.json")))
	with open(colours_list_path, mode="w+", encoding="utf-8") as file:
		colours: dict[Literal["absolute", "relative"], list[str]] = json_load(file)

	for key in styles:
		styles[key][0]
		colours["relative"]


if __name__ == "__main__":
	main()
