from os import name as os_name
from os import path
from typing import Literal, final

type t_default_keys = Literal[
	"absolute-length-unit",
	"angle-unit",
	"default-viewport-unit",
	"dynamic-viewport-unit",
	"frequency-unit",
	"large-viewport-percentage-unit",
	"local-font-relative-length-unit",
	"physical-unit",
	"relative-length-unit",
	"resolution-unit",
	"root-font-relative-length-unit",
	"small-viewport-percentage-unit",
	"time-unit",
	"viewport-unit",
	"visual-angle-unit",
	"colour-absolute",
	"colour-relative",
	"screen-size",
	"font-size",
	"font-weight",
	"line-height",
	"letter-spacing",
]
type t_styles_keys = Literal["regular", "custom"]


IS_WINDOWS = os_name.lower() == "windows"


def abs_path(p: str | list[str]) -> str:
	if isinstance(p, str):
		return path.abspath(path.expanduser(path.normpath(p)))

	return path.abspath(path.expanduser(path.normpath(path.join(*p))))


# https://stackoverflow.com/a/287944/7641789
@final
class BColours:
	HEADER = "\033[95m"
	OKBLUE = "\033[94m"
	OKCYAN = "\033[96m"
	OKGREEN = "\033[92m"
	WARNING = "\033[93m"
	FAIL = "\033[91m"
	ENDC = "\033[0m"
	BOLD = "\033[1m"
	UNDERLINE = "\033[4m"


if __name__ == "__main__":
	pass
