import re
from itertools import chain
from json import loads as json_loads
from os import path as os_path
from platform import system
from typing import Any, Dict, List, Literal, Optional, Pattern, Tuple, TypedDict, Union, cast

import sublime
import sublime_plugin

PROJECT_NAME = "tailwindcss-Class-Sorter"
SETTINGS_FILE = f"{PROJECT_NAME}.sublime-settings"
PLATFORM = system()
KEYMAP_FILE = f"Default ({PLATFORM}).sublime-keymap"
IS_WINDOWS = PLATFORM == "Windows"

OrderType = Literal["recess", "concentric", "smacss"]
OrderList = List[Tuple[str, List[str]]]
OrderListPrint = List[Tuple[int, str, List[str]]]


class Overwrite(TypedDict):
	group_index: int
	regex_list: List[str]


class Amend(TypedDict):
	group_index: int
	position: Literal["start", "end"]
	regex_list: List[str]


class Append(TypedDict):
	group_index: int
	group_name: str
	position: Literal["before", "after"]
	append_order: int
	regex_list: List[str]


class SpecialCase(TypedDict):
	classes: List[str]
	index: List[int]
	minimum: Union[int, None]


class SpecialCases(TypedDict):
	position_style: SpecialCase
	display_style: SpecialCase


class MatchedData(TypedDict):
	group_name_index: Union[int, None]
	group_order_weight: Union[float, None]
	breakpoint_order_weight: Union[int, float, None]


class OrderData(TypedDict):
	to_print: Optional[OrderListPrint]
	to_sort: Optional[Tuple[OrderList, List[str]]]


class SettingsData(TypedDict):
	variables: Dict[str, Any]
	config: Dict[str, Any]
	order: OrderData


class Settings:
	data: SettingsData = {
		"variables": {},
		"config": {},
		"order": {
			"to_print": None,
			"to_sort": None,
		},
	}

	@classmethod
	def set_settings(cls, view: sublime.View, variables: Dict[str, str]) -> None:
		settings_default = sublime.load_settings(SETTINGS_FILE).to_dict()
		settings_default = {k: v for k, v in Settings.flatten_dict(settings_default)}
		cls.data["config"] = settings_default

		settings_user = view.settings().to_dict()
		settings_user = {k: v for k, v in settings_user.items() if "tailwindcss-Class-Sorter" in k}
		settings_user = {k[25:]: v for k, v in Settings.flatten_dict(settings_user)}
		cls.data["config"].update(settings_user)

		variables.update({k: v for k, v in cls.data["config"].items() if "." not in k and isinstance(v, str)})
		cls.data["variables"] = variables

		for k, v in cls.data["config"].items():
			if isinstance(v, str) and "${" in v and "}" in v:
				v = sublime.expand_variables(v, cls.data["variables"])
				cls.data["config"][k] = v

			if isinstance(v, str) and "path" in k:
				v = os_path.normpath(os_path.expanduser(v))
				cls.data["config"][k] = v

		pattern = re.compile(r"extensions_regex\.")
		extensions: List[str] = [*filter(lambda elem: pattern.match(elem), Settings.data["config"])]
		extensions = list({extension.split(".")[1] for extension in extensions})
		cls.data["config"]["extensions"] = extensions

		# Set data["order"]
		order_type: OrderType = cast(OrderType, cls.data["config"]["order_type"])
		order_json: Dict[OrderType, OrderList] = json_loads(
			sublime.load_resource(sublime.find_resources("order_list.json")[0]),
		)
		order_list: OrderList = order_json[order_type]

		cls.data["order"]["to_print"] = [*map(lambda x: (x[0], x[1][0], x[1][1]), enumerate(order_list))]

		edit_order_overwrite: List[Overwrite] = cls.data["config"].setdefault("edit_order.overwrite", [])
		edit_order_amend: List[Amend] = cls.data["config"].setdefault("edit_order.amend", [])
		edit_order_append: List[Append] = cls.data["config"].setdefault("edit_order.append", [])

		# "overwrite": [
		# 	{
		# 		"group_index": 1,
		# 		"regex_list": [],
		# 	},
		# ],

		for item in edit_order_overwrite:
			order_list[item["group_index"]] = (order_list[item["group_index"]][0], item["regex_list"])

		# "amend": [
		# 	{
		# 		"group_index": 1,
		# 		"position": "start | end",
		# 		"regex_list": [],
		# 	},
		# ],

		for item in edit_order_amend:
			order_list[item["group_index"]] = (
				(order_list[item["group_index"]][0], item["regex_list"] + order_list[item["group_index"]][1])
				if item["position"] == "start"
				else (order_list[item["group_index"]][0], order_list[item["group_index"]][1] + item["regex_list"])
			)

		# "append": [
		# 	{
		# 		"group_index": 1,
		# 		"group_name": "name",
		# 		"position": "before | after",
		# 		"append_order": 1,
		# 		"regex_list": [],
		# 	},
		# ],

		# Sort higher "append_order" first
		edit_order_append.sort(reverse=True, key=lambda item: item["append_order"])
		# Sort "after" then "before"
		edit_order_append.sort(reverse=False, key=lambda item: ord(item["position"][0:1]))
		# Sort higher "group_index" first
		edit_order_append.sort(reverse=True, key=lambda item: item["group_index"])

		for item in edit_order_append:
			append_index = item["group_index"] - 1 if item["position"] == "before" else item["group_index"] + 1
			order_list = (
				[(item["group_name"], item["regex_list"])] + order_list
				if append_index < 0
				else order_list[0:append_index] + [(item["group_name"], item["regex_list"])] + order_list[append_index:]
			)

		order_group_name_list: List[str] = [*map(lambda x: cast(str, x[0]), order_list)]
		cls.data["order"]["to_sort"] = (order_list, order_group_name_list)

	@classmethod
	def flatten_dict(cls, obj: Dict[str, Any], keystring: str = ""):
		if isinstance(obj, dict):
			keystring = f"{keystring}." if keystring else keystring

			for k in obj:
				yield from Settings.flatten_dict(obj[k], keystring + str(k))
		else:
			yield keystring, obj

	@staticmethod
	def get_settings(view: sublime.View) -> SettingsData:
		variables = cast(sublime.Window, view.window()).extract_variables()

		if (
			variables["file_extension"] == "sublime-project"
			or len(Settings.data["variables"]) == 0
			or len(Settings.data["config"]) == 0
			or Settings.data["variables"]["file_extension"] != variables["file_extension"]
		):
			Settings.set_settings(view, variables)

		return Settings.data


class TailwindcssClassSorterEventListeners(sublime_plugin.EventListener):
	@staticmethod
	def should_run_command(view, settings: SettingsData) -> bool:
		extensions = Settings.data["config"]["extensions"]
		extension = settings["variables"]["file_extension"] or settings["variables"]["file_name"].split(".")[-1]

		return not extensions or extension in extensions

	@staticmethod
	def on_pre_save(view) -> None:
		settings = Settings.get_settings(view)

		if settings["config"]["format_on_save"] and TailwindcssClassSorterEventListeners.should_run_command(view, settings):
			view.run_command("sort_tailwindcss")


class SortTailwindcssCommand(sublime_plugin.TextCommand):
	def run(self, edit) -> None:
		settings = Settings.get_settings(self.view)

		if not TailwindcssClassSorterEventListeners.should_run_command(self.view, settings):
			print('>>> tailwindcss-Class-Sorter: File type not in "extensions_regex"')
			return

		### Get settings ###

		file_extension: str = settings["variables"]["file_extension"] or settings["variables"]["file_name"].split(".")[-1]
		region_regex: str = cast(str, settings["config"][f"extensions_regex.{file_extension}.region"])
		class_regex: str = cast(str, settings["config"][f"extensions_regex.{file_extension}.class"])
		conditional_split_character: str = cast(
			str, settings["config"].get(f"extensions_regex.{file_extension}.conditional_split_character", "?")
		)
		conditional_class_location: str = cast(
			str, settings["config"].get(f"extensions_regex.{file_extension}.conditional_class_location", "after")
		)
		separator_string: str = cast(str, settings["config"].get(f"extensions_regex.{file_extension}.separator", " "))
		placement: str = cast(str, settings["config"]["non_tailwindcss_placement"])
		order_list, order_group_name_list = cast(Tuple[OrderList, List[str]], settings["order"]["to_sort"])
		breakpoint_grouping: str = cast(str, settings["config"]["breakpoint_grouping"])
		breakpoint_multiplier: Union[int, float] = 1000 if breakpoint_grouping == "breakpoint" else 0.00001
		variant_ordering: List[str] = cast(List[str], settings["config"]["variant_ordering"])
		breakpoint_order: List[str] = cast(List[str], settings["config"]["breakpoint_order"])

		### Expand group-* / peer-* in variant_order ###

		variant_ordering_no_star = variant_ordering.copy()

		# Expand group-*
		try:
			variant_ordering_no_star.remove("group-*")
			variant_ordering_group = [f"group-{x}" for x in variant_ordering_no_star if x != "group-*"]
			group_star_index = variant_ordering.index("group-*")
		except:
			variant_ordering_group = []
			group_star_index = 0

		variant_ordering = variant_ordering[:group_star_index] + variant_ordering_group + variant_ordering[group_star_index:]

		# Expand peer-*
		try:
			variant_ordering_no_star.remove("peer-*")
			variant_ordering_peer = [f"peer-{x}" for x in variant_ordering_no_star if x != "peer-*"]
			peer_star_index = variant_ordering.index("peer-*")
		except:
			variant_ordering_peer = []
			peer_star_index = 0

		variant_ordering = variant_ordering[:peer_star_index] + variant_ordering_peer + variant_ordering[peer_star_index:]

		### Define default regex(es) ###

		re_class_regex = re.compile(class_regex)
		re_string_start = re.compile(r"[a-zA-Z!-\[\]]")
		re_template_class = re.compile(r"(\"[^\"]*?\")|('[^']*?')|(`[^`]*?`)")
		re_tw_variant = re.compile(r":[a-zA-Z!-]")

		### Define special cases ###

		special_cases: SpecialCases = {
			"position_style": {
				"classes": ["static", "absolute", "relative", "fixed", "sticky"],
				"index": [],
				"minimum": None,
			},
			"display_style": {
				"classes": ["hidden", "inline", "block", "flex", "grid", "table", "contents", "flow", "list"],
				"index": [],
				"minimum": None,
			},
		}
		special_cases["position_style"]["index"] = [
			*map(lambda x: order_group_name_list.index(x), special_cases["position_style"]["classes"]),
		]
		special_cases["position_style"]["minimum"] = min(*special_cases["position_style"]["index"])
		special_cases["display_style"]["index"] = [
			*map(lambda x: order_group_name_list.index(x), special_cases["display_style"]["classes"]),
		]
		special_cases["display_style"]["minimum"] = min(*special_cases["display_style"]["index"])

		### Get regions and region lengths ###

		region_list = self.view.find_all(region_regex)
		region_offset = 0

		### Main function ###

		for region_item in region_list:
			region_size = region_item.size()

			# Reset region begin and end if region offset is not 0
			region = (
				region_item
				if region_offset == 0
				else sublime.Region(region_item.begin() + region_offset, region_item.end() + region_offset)
			)

			region_string: str = self.view.substr(region)
			class_list: List[str] = re_class_regex.findall(region_string)

			# Setup container for class groups
			class_list_grouped: List[Tuple[str, List[Tuple[float, str]]]] = [*map(lambda x: (x, []), order_group_name_list)]
			class_list_others: Union[List[str], None] = None
			class_list_result = ""

			# Group class_names together and get group order weight
			for class_name in class_list:
				class_name_group_order_sort = class_name

				# find dynamic class_name (if/else | class binding | valueConverter) by templating engine
				if re_string_start.match(class_name) is None:  # if string doesn't start with [a-zA-Z!-\[\]]
					res = class_name.split(conditional_split_character)[0 if conditional_class_location == "before" else 1]
					res = re_template_class.finditer(res)
					res = [x.group() for x in res]
					for item in res:
						if len(item[1:-1]) > 0:
							class_name_group_order_sort = item[1:-1]
							break

				# removes variants
				if re_tw_variant.search(class_name_group_order_sort):
					class_name_group_order_sort = class_name_group_order_sort.split(":")[-1]

				# removes "!" for class_list starting with "!"
				class_name_group_order_sort = self.cleanup(class_name_group_order_sort, ["!"])

				# removes ["!", "-", "no-", "not-", "min-", "max-", "auto-"]
				group_name = self.cleanup(class_name_group_order_sort, ["!", "-", "no-", "not-", "min-", "max-", "auto-"])

				# removes opacity modifier (eg: text-red-500/50)
				group_name = self.cleanup(class_name_group_order_sort, [re.compile(r"/\d+$")], True)

				# removes group / peer differentiator (eg: group/{name} | peer/{name})
				group_name = self.cleanup(class_name_group_order_sort, [re.compile(r"/\w+$")], True)

				# get group_name
				group_name = group_name.split("-")[0]

				matched_data: MatchedData = {
					"group_name_index": None,  # 1
					"group_order_weight": None,  # 0.001
					"breakpoint_order_weight": None,  # 1000 if (breakpoint_grouping == "breakpoint") else 0.00001
				}
				if group_name in order_group_name_list:
					group_name_index_list = [
						*filter(lambda x: order_group_name_list[x] == group_name, range(len(order_group_name_list))),
					]

					for group_name_index_list_index, group_name_index in enumerate(group_name_index_list):
						# Get group_name_index & group_order_weight
						for regex_index, regex in enumerate(order_list[group_name_index][1]):
							match = re.match(f"^{regex}$", class_name_group_order_sort)

							if match is not None:
								if special_cases["position_style"]["index"].count(group_name_index) > 0:
									matched_data["group_name_index"] = special_cases["position_style"]["minimum"]
								elif special_cases["display_style"]["index"].count(group_name_index) > 0:
									matched_data["group_name_index"] = special_cases["display_style"]["minimum"]
								else:
									matched_data["group_name_index"] = group_name_index

								matched_data["group_order_weight"] = regex_index * 0.001
								break

							# Catch arbitrary classes (eg "bg-[#123456]")
							if (
								group_name_index_list_index == (len(group_name_index_list) - 1)
								and regex_index == (len(order_list[group_name_index][1]) - 1)
								and class_name.find("[") > -1
								and class_name.rfind("]") > -1
							):
								if special_cases["position_style"]["index"].count(group_name_index) > 0:
									matched_data["group_name_index"] = special_cases["position_style"]["minimum"]
								elif special_cases["display_style"]["index"].count(group_name_index) > 0:
									matched_data["group_name_index"] = special_cases["display_style"]["minimum"]
								else:
									matched_data["group_name_index"] = group_name_index

								matched_data["group_order_weight"] = 0.999
								break

						if matched_data["group_name_index"] is not None:
							break

				# Sort variants
				class_name_variant_sort = None

				# find dynamic class_name (if/else | class binding | valueConverter) by templating engine
				if re_string_start.match(class_name) is None:  # if string doesn't start with [a-zA-Z!-\[\]]
					class_name_variant_sort = []
					res = class_name.split(conditional_split_character)[0 if conditional_class_location == "before" else 1]
					res = re_template_class.finditer(res)
					res = [x.group() for x in res]
					for index, item in enumerate(res):
						class_name_variant_sort.append(item[1:-1])

				if class_name_variant_sort is None:  # If class_name is not set dynamically
					if class_name.count(":") > 1:
						class_name = class_name.split(":")
						class_name = self.merge_dynamic_variant_parts(class_name)
						class_name = self.sort_variants(class_name, variant_ordering)
				else:  # If class_name is set dynamically (if/else | class binding | valueConverter) by templating engine
					for index, item in enumerate(class_name_variant_sort):
						if item.count(":") > 1:
							item = item.split(":")
							item = self.merge_dynamic_variant_parts(item)
							class_name_variant_sort[index] = self.sort_variants(item, variant_ordering)

					# replace dynamic class_name (if/else | class binding | valueConverter) by templating engine with sorted version
					class_name_find_replace = class_name.split(conditional_split_character)
					class_name_find_replace_with_conditional = (
						f"{conditional_split_character}{class_name_find_replace[1]}"
						if conditional_class_location == "before"
						else f"{class_name_find_replace[0]}{conditional_split_character}"
					)
					class_name_find_replace = re_template_class.split(
						class_name_find_replace[0 if conditional_class_location == "before" else 1],
					)
					class_name_find_replace = [x for x in class_name_find_replace if x is not None]
					class_name_variant_sort_index = 0
					for index, item in enumerate(class_name_find_replace):
						if re_template_class.match(item):
							quote_start = class_name_find_replace[index][0]
							quote_end = class_name_find_replace[index][-1]
							class_name_find_replace[index] = quote_start + class_name_variant_sort[class_name_variant_sort_index] + quote_end
							class_name_variant_sort_index += 1

					class_name = (
						f"{''.join(class_name_find_replace)}{class_name_find_replace_with_conditional}"
						if conditional_class_location == "before"
						else f"{class_name_find_replace_with_conditional}{''.join(class_name_find_replace)}"
					)

				# Get breakpoint_order_weight
				if class_name_variant_sort is None:  # If class_name is not set dynamically
					if class_name.count(":") == 0:
						matched_data["breakpoint_order_weight"] = 0
					else:
						class_name_variant_sort = class_name.split(":")
						class_name_variant_sort = self.merge_dynamic_variant_parts(class_name_variant_sort)
						for breakpoint_index, breakpoint_item in enumerate(breakpoint_order):
							# found breakpoint
							if f"{breakpoint_item}:" in class_name and f"-{breakpoint_item}:" not in class_name:
								matched_data["breakpoint_order_weight"] = (breakpoint_index + 1) * breakpoint_multiplier
								break

							# found breakpoint
							if breakpoint_item in {"min-*", "max-*"} and re.search(f"{breakpoint_item[:-1]}[^:]+", class_name) is not None:
								matched_data["breakpoint_order_weight"] = (breakpoint_index + 1) * breakpoint_multiplier
								break

							# no breakpoint found
							if breakpoint_index == (len(breakpoint_order) - 1):
								matched_data["breakpoint_order_weight"] = 0
				else:  # If class_name is set dynamically (if/else | class binding | valueConverter)
					for index, item in enumerate(class_name_variant_sort):
						if class_name_variant_sort[index].count(":") == 0:
							matched_data["breakpoint_order_weight"] = 0
						else:
							for breakpoint_index, breakpoint_item in enumerate(breakpoint_order):
								# found breakpoint
								if f"{breakpoint_item}:" in class_name_variant_sort[index] and f"-{breakpoint_item}:" not in class_name:
									matched_data["breakpoint_order_weight"] = (breakpoint_index + 1) * breakpoint_multiplier
									break

								# found breakpoint
								if (
									breakpoint_item in {"min-*", "max-*"}
									and re.search(f"{breakpoint_item[:-1]}[^:]+", class_name_variant_sort[index]) is not None
								):
									matched_data["breakpoint_order_weight"] = (breakpoint_index + 1) * breakpoint_multiplier
									break

						if matched_data["breakpoint_order_weight"] is not None:
							break

						# no breakpoint found
						if index == (len(class_name_variant_sort) - 1):
							matched_data["breakpoint_order_weight"] = 0

				# Group class_name together
				if matched_data["group_name_index"] is None:
					class_list_others = [class_name] if class_list_others is None else class_list_others + [class_name]
				else:
					class_list_grouped[matched_data["group_name_index"]][1].append(
						(
							cast(int, matched_data["group_name_index"])
							+ cast(float, matched_data["group_order_weight"])
							+ cast(Union[int, float], matched_data["breakpoint_order_weight"]),
							class_name,
						),
					)

			# Trim empty groups and group_name
			class_list_grouped_trimmed = [*map(lambda y: y[1], filter(lambda x: len(x[1]) > 0, class_list_grouped))]

			# Flatten list, and sort according to order_weight and trim order_weight
			class_list_grouped_trimmed = [*chain(*class_list_grouped_trimmed)]
			class_list_grouped_trimmed.sort(key=lambda x: x[0])

			### Handle "before:" | "after:" pseudo-elements variants ###

			# Separate "before:" | "after:" variant
			class_list_before_element = [
				*filter(lambda x: "before:" in x[1], class_list_grouped_trimmed),
			]
			class_list_after_element = [
				*filter(lambda x: "after:" in x[1], class_list_grouped_trimmed),
			]
			class_list_grouped_trimmed = [
				*filter(
					lambda x: "before:" not in x[1] and "after:" not in x[1],
					class_list_grouped_trimmed,
				),
			]

			class_list_result = separator_string.join([*map(lambda x: x[1], class_list_grouped_trimmed)])

			# Reapply "before:" | "after:" variant
			class_list_before_element_result = separator_string.join([*map(lambda x: x[1], class_list_before_element)])
			class_list_after_element_result = separator_string.join([*map(lambda x: x[1], class_list_after_element)])
			if placement == "front":
				# "before:" comes before "after:"
				if len(class_list_after_element_result) != 0:
					class_list_result = f"{class_list_after_element_result}{separator_string}{class_list_result}"
				if len(class_list_before_element_result) != 0:
					class_list_result = f"{class_list_before_element_result}{separator_string}{class_list_result}"
			else:
				# "before:" comes before "after:"
				if len(class_list_before_element_result) != 0:
					class_list_result = f"{class_list_result}{separator_string}{class_list_before_element_result}"
				if len(class_list_after_element_result) != 0:
					class_list_result = f"{class_list_result}{separator_string}{class_list_after_element_result}"

			### Reapply non-TailwindCSS classes ###

			if class_list_others is not None:
				class_name = res = separator_string.join(class_list_others)
				if len(class_list_result) == 0:
					class_list_result = f"{separator_string}{class_name}".strip()
				elif placement == "front":
					class_list_result = f"{separator_string}{class_name}{separator_string}{class_list_result}".strip()
				else:
					class_list_result = f"{separator_string}{class_list_result}{separator_string}{class_name}".strip()

			### Get region offset if replace string has different length ###

			if len(class_list_result) != region_size:
				region_offset = region_offset + len(class_list_result) - region_size

			self.view.replace(edit, region, class_list_result)

	def cleanup(
		self,
		class_name: str,
		remove_list: Union[List[str], List[Pattern[str]]],
		check_from_tail: bool = False,
	) -> str:
		for item in remove_list:
			if check_from_tail is False:
				if class_name.startswith(cast(str, item)):
					class_name = class_name[len(cast(str, item)) :]
			else:
				match = re.search(item, class_name)
				if match is not None:
					class_name = class_name[: -len(match.group())]

		return class_name

	def merge_dynamic_variant_parts(self, class_name: List[str]) -> List[str]:
		bracket_open = False
		merged = []

		for part in class_name:
			if bracket_open is True:
				merged[-1] = f"{merged[-1]}:{part}"

				if part.endswith("]"):
					bracket_open = False
			else:
				merged.append(part)

				if ("-[" in part or part.startswith("[")) and part.rfind("]") == -1:
					bracket_open = True

		return merged

	def sort_variants(self, class_name: List[str], order: List[str]) -> str:
		class_base = class_name[-1]
		class_variants = class_name[:-1]
		class_variants.sort(key=lambda variant: self.get_variant_order(variant, order))
		class_variants.append(class_base)

		return ":".join(class_variants)

	def get_variant_order(self, variant: str, order: List[str]) -> int:
		try:
			if variant.startswith("group-aria-") and variant not in order:
				variant_ordering_group = f"{variant[:11]}*"
			elif variant.startswith("peer-aria-") and variant not in order:
				variant_ordering_group = f"{variant[:10]}*"
			elif variant.startswith("supports-") and variant not in order:
				variant_ordering_group = f"{variant[:9]}*"
			elif variant.startswith("group-") and variant not in order:
				variant_ordering_group = f"{variant[:6]}*"
			elif variant.startswith(("peer-", "aria-", "data-")) and variant not in order:
				variant_ordering_group = f"{variant[:5]}*"
			elif variant.startswith(("min-", "max-")) and variant not in order:
				variant_ordering_group = f"{variant[:4]}*"
			else:
				variant_ordering_group = variant

			return order.index(variant_ordering_group)
		except:
			return 99999


class GetDefaultGroupIndexListTailwindcssCommand(sublime_plugin.TextCommand):
	def run(self, edit) -> None:
		settings = Settings.get_settings(self.view)
		print(settings["order"]["to_print"])
