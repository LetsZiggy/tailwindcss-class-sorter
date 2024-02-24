from os import name as os_name
from os import path
from subprocess import run as process_run
from typing import Literal, final

from selenium.webdriver import Firefox
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.firefox.webdriver import WebDriver
from webdriver_manager.firefox import GeckoDriverManager

type T_STYLES_KEYS = Literal["regular", "custom"]
type T_STYLES = dict[T_STYLES_KEYS, list[str]]

# fmt: off
type T_DEFAULT_KEYS = Literal[
	"angle-unit",
	"frequency-unit",
	"resolution-unit",
	"time-unit",

	"physical-unit",
	"absolute-length-unit",
	"root-font-relative-length-unit",
	"local-font-relative-length-unit",
	"relative-length-unit",

	"visual-angle-unit",
	"flex-unit",
	"container-unit",
	"dynamic-viewport-unit",
	"small-viewport-percentage-unit",
	"large-viewport-percentage-unit",
	"default-viewport-unit",
	"viewport-unit",

	"colour-absolute",
	"colour-relative",

	"screen-size",
	"font-size",
	"font-weight",
	"letter-spacing",
	"line-height",
]
# fmt: on
type T_DEFAULTS = dict[T_DEFAULT_KEYS, list[str]]

type T_ADDITIONAL_CLASSES_P_KEYS = Literal["3rd-party"]
type T_ADDITIONAL_CLASSES_S_KEYS = Literal["links", "regular", "custom"]
type T_ADDITIONAL_CLASSES = dict[T_ADDITIONAL_CLASSES_P_KEYS, dict[str, dict[T_ADDITIONAL_CLASSES_S_KEYS, list[str]]]]

IS_WINDOWS = os_name.lower() == "windows"
ROOT_PATH: str = (
	process_run(["git", "rev-parse", "--show-toplevel"], capture_output=True, check=False, shell=IS_WINDOWS)
	.stdout.decode("UTF-8")
	.strip()
)
# must match with "tailwindcss-class-sorter/generator-order-list/helper.ts"
SKIP_STYLES_GROUPS_COLOUR_REMOVE: dict[str, str] = {
	"tailwindcss-typography": "prose-",
	"font-weight": "font-black",
	"white-space": "whitespace-",
	"filter-grayscale": "grayscale",
	"backdrop-filter-grayscale": "backdrop-grayscale",
}


def init_webdriver(driver_path: str | None) -> WebDriver:
	driver_options = Options()
	driver_options.add_argument("-headless")

	# https://github.com/mozilla/geckodriver/releases
	if driver_path is None or not path.exists(driver_path):
		return Firefox(service=Service(GeckoDriverManager().install()), options=driver_options)
	else:
		return Firefox(service=Service(driver_path), options=driver_options)


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
