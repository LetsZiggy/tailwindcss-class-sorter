# https://github.com/heybourn/headwind/blob/master/package.json
import re
from itertools import chain
from json import loads
from os import path
from platform import system
from sys import exc_info
from typing import Any, Dict, List, Literal, Pattern, Tuple, TypedDict, Union, cast

import sublime
import sublime_plugin

### Define types ###

OrderType = Literal["recess", "concentric", "smacss"]
OrderList = List[Tuple[str, List[str]]]


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


class EditOrder(TypedDict):
	overwrite: List[Overwrite]
	amend: List[Amend]
	append: List[Append]


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


### Define global ###

PROJECT_NAME = "tailwindcss-Class-Sorter"
SETTINGS_FILE = f"{PROJECT_NAME}.sublime-settings"
PLATFORM = system()
KEYMAP_FILE = f"Default ({PLATFORM}).sublime-keymap"
IS_WINDOWS = PLATFORM == "Windows"


class SortTailwindcssCommand(sublime_plugin.TextCommand):
	def run(self, edit):
		try:
			### Get settings ###

			file_extension: str = path.splitext(self.view.file_name())[1][1:]
			region_regex: str = cast(str, PluginUtils.get_pref(["extensions_regex", file_extension, "region"], self.view))
			region_regex: str = (
				region_regex.get(file_extension, {}).get("region", "") if isinstance(region_regex, dict) else region_regex
			)
			class_regex: str = cast(str, PluginUtils.get_pref(["extensions_regex", file_extension, "class"], self.view))
			class_regex: str = (
				class_regex.get(file_extension, {}).get("class", "") if isinstance(class_regex, dict) else class_regex
			)
			conditional_split_character: str = cast(
				str,
				PluginUtils.get_pref(["extensions_regex", file_extension, "conditional_split_character"], self.view),
			)
			conditional_split_character: str = (
				conditional_split_character.get(file_extension, {}).get("conditional_split_character", "?")
				if isinstance(conditional_split_character, dict)
				else conditional_split_character
			)
			conditional_class_location: str = cast(
				str,
				PluginUtils.get_pref(["extensions_regex", file_extension, "conditional_class_location"], self.view),
			)
			conditional_class_location: str = (
				conditional_class_location.get(file_extension, {}).get("conditional_class_location", "after")
				if isinstance(conditional_class_location, dict)
				else conditional_class_location
			)
			separator_string: str = cast(str, PluginUtils.get_pref(["extensions_regex", file_extension, "separator"], self.view))
			separator_string: str = (
				separator_string.get(file_extension, {}).get("separator", " ")
				if isinstance(separator_string, dict)
				else separator_string
			)
			placement: str = cast(str, PluginUtils.get_pref(["non_tailwindcss_placement"], self.view))
			order_list, order_group_name_list = cast(Tuple[OrderList, List[str]], PluginUtils.get_order(self.view))
			breakpoint_grouping: str = cast(str, PluginUtils.get_pref(["breakpoint_grouping"], self.view))
			breakpoint_multiplier: Union[int, float] = 1000 if breakpoint_grouping == "breakpoint" else 0.00001
			variant_ordering: List[str] = cast(List[str], PluginUtils.get_pref(["variant_ordering"], self.view))
			breakpoint_order: List[str] = cast(List[str], PluginUtils.get_pref(["breakpoint_order"], self.view))

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
								class_name_find_replace[index] = (
									quote_start + class_name_variant_sort[class_name_variant_sort_index] + quote_end
								)
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
		except:
			print(exc_info())

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
		try:
			# Get order_type and apply "edit_order"
			_, order_group_name_list = PluginUtils.get_order(self.view, True)
			print(order_group_name_list, sep="\n\n")
		except:
			print(exc_info())


class TailwindcssClassSorterEventListeners(sublime_plugin.EventListener):
	@staticmethod
	def should_run_command(view) -> bool:
		if not PluginUtils.get_pref(["format_on_save"], view):
			return False

		# Flat settings in .sublime-project
		pattern = re.compile(r"tailwindcss-Class-Sorter\.extensions_regex\.")
		file_extensions: List[str] = [*view.settings().to_dict()]
		file_extensions = [*filter(lambda elem: pattern.match(elem), file_extensions)]
		if len(file_extensions) > 0:
			file_extensions = [
				*map(lambda elem: elem.split("tailwindcss-Class-Sorter.extensions_regex.")[1].split(".")[0], file_extensions),
			]
			file_extensions = [*set(file_extensions)]
		# Nested settings in .sublime-project | Default settings
		else:
			file_extensions = [*PluginUtils.get_pref(["extensions_regex"], view)]

		file_extension = path.splitext(view.file_name())[1][1:]

		# Default to using filename if no file_extension
		if not file_extension:
			file_extension = path.basename(view.file_name())

		# Skip if extension is not listed
		return not file_extensions or file_extension in file_extensions

	@staticmethod
	def on_pre_save(view) -> None:
		if TailwindcssClassSorterEventListeners.should_run_command(view):
			view.run_command("sort_tailwindcss")


class PluginUtils:
	@staticmethod
	def get_pref(key_list: List[str], view=None) -> Union[str, List[str], Dict[str, Any]]:
		if view is not None:
			settings = view.settings()

			# Flat settings in .sublime-project
			flat_keys = ".".join(key_list)
			if settings.has(f"{PROJECT_NAME}.{flat_keys}"):
				value = settings.get(f"{PROJECT_NAME}.{flat_keys}")
				return value

			# Nested settings in .sublime-project
			if settings.has(PROJECT_NAME):
				value = settings.get(PROJECT_NAME)

				for key in key_list:
					try:
						value = value[key]
					except:
						value = None
						break

				if value is not None:
					return value

		global_settings = sublime.load_settings(SETTINGS_FILE)
		value = global_settings.get(key_list[0])

		# Load active user settings
		user_settings = sublime.active_window().active_view().settings()

		# Overwrite global config value if it's defined
		if user_settings.has(PROJECT_NAME):
			value = user_settings.get(PROJECT_NAME).get(key_list[0], value)

		return value

	@staticmethod
	def get_order(view, to_enumerate=False) -> Union[Tuple[OrderList, List[Tuple[int, str]]], Tuple[OrderList, List[str]]]:
		order_type: OrderType = cast(OrderType, PluginUtils.get_pref(["order_type"], view))
		order_json: Dict[OrderType, OrderList] = loads(
			sublime.load_resource(sublime.find_resources("order_list.json")[0]),
		)
		order_list: OrderList = order_json[order_type]
		edit_order: EditOrder = cast(EditOrder, PluginUtils.get_pref(["edit_order"], view))

		# Print order_list for reference if to_enumerate is True
		if to_enumerate is True:
			order_indexed_group_name_list: List[Tuple[int, str]] = [*map(lambda x: (x[0], x[1][0]), enumerate(order_list))]
			return (order_list, order_indexed_group_name_list)

		edit_order_overwrite = edit_order.setdefault("overwrite", [])
		edit_order_amend = edit_order.setdefault("amend", [])
		edit_order_append = edit_order.setdefault("append", [])

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
		return (order_list, order_group_name_list)
