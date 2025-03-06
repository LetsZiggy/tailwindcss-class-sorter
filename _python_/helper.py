from os import path
from typing import Literal

type t_default_keys = Literal["angle-unit", "colour-absolute", "colour-relative", "text-size"]
type t_styles_keys = Literal["regular", "custom"]


def abs_path(p: str | list[str]) -> str:
	if isinstance(p, str):
		return path.abspath(path.expanduser(path.normpath(p)))

	return path.abspath(path.expanduser(path.normpath(path.join(*p))))


if __name__ == "__main__":
	pass
