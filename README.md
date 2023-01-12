# tailwindcss Class Sorter for Sublime Text

*Please note the plugin hasn't been submitted to [packagecontrol.io](https://packagecontrol.io/). Thus has to be installed manually.*

<br>

### Installation

#### Installing plugin

- `Package Control: Add Repository` Method (Recommended)
	1. Open `Command Palette` (Default: `Primary + Shift + p`)
	2. `Package Control: Add Repository`
	3. `https://raw.githubusercontent.com/LetsZiggy/Sublime-tailwindcss-Class-Sorter/main/repository-package.json`
	4. Open `Command Palette`
	5. `Package Control: Install Package`
	6. `tailwindcss-Class-Sorter`
- "Manual" Method (Requires manual update)
	1. Download this repository through `Download ZIP`
	2. Rename folder to `tailwindcss-Class-Sorter`
	3. Move folder to `[SublimeText]/Packages` folder
		- To access `[SublimeText]/Packages` folder:
			1. Open/Restart `Sublime Text`
			2. Open the `Command Palette` (Default: `Primary + Shift + p`)
			3. `Preferences: Browse Packages`
	4. Restart `Sublime Text`

---

### Commands

#### Command palette:

- `tailwindcss Class Sorter: Format this file`
- `tailwindcss Class Sorter: Get Group Index List`
	- Prints current state of [order_list] with index to `Console Panel` (Default: `` Primary + ` ``)
	- eg: [[index, group_name], ...]
	- For "group_name", see below - [edit_order](#user-content-default-settings)

#### Shortcut key:

- `tailwindcss Class Sorter: Format this file`
	- Default: `Primary + Shift + .`

---

### Usage

#### Using default settings ({ format_on_save: false })

1. Save current changes
2. Use `tailwindcss Class Sorter: Format this file`

---

### Configuring Settings

#### To access and modify settings file

Go to `Preferences -> Package Settings -> tailwindcss-Class-Sorter -> Settings`

Note:
- JIT classes (eg: bg-[#fafafa]) are sorted to the back of similar style classes regardless of breakpoint

#### To override settings per project basis

To override global plugin configuration for a specific project, add a settings object with a `tailwindcss-Class-Sorter` key in your `.sublime-project`. This file is accessible via `Project -> Edit Project`.

```javascript
/* EXAMPLE */
{
	"folders": [
		{
			"path": ".",
		},
	],
	"settings": {
		"tailwindcss-Class-Sorter": {
			"format_on_save": true,
		},
	},
}
```

#### Default settings:

```javascript
{
	/**
	 * Automatically format when a file is saved
	 */
	"format_on_save": false,

	/**
	 * Placement of non-TailwindCSS classes
	 * Options: front | back
	 *
	 * Pseudo-elements (`before:` | `after:`) will be placed:
	 * 	- right after non-TailwindCSS classes if `front` is selected
	 * 	- right before non-TailwindCSS classes if `back` is selected
	 */
	"non_tailwindcss_placement": "front",

	/**
	 * Set file extensions to format
	 *
	 * "extensions_regex": {
	 * 	[extension]: {
	 * 		"region": Regex to detect the classes ([class="a b c"] becomes [a b c])
	 * 		"class": Regex to find each class using "re.findall()" (Place more specific regex first)
	 * 		"conditional_split_character": Character used to split ternary expression or complex class bindings by templating engine
	 * 		"conditional_class_location": "before" | "after" string used to determine where the classes resides in the complex expression after splitting with "conditional_split_character"
	 * 		"separator": Separator character between classes (Only required if classes are not space separated)
	 * 	},
	 * },
	 *
	 * Explanation:
	 * 	"extension" is the file type
	 * 	"region" remains the same as default "class" attribute is used
	 * 	"class" regex to find CSS classes with more specific regex placed in front
	 * 	"conditional_split_character" is required if classes are complex templating engine expression
	 * 		- if classes are dynamically added through ternary expression by templating engine
	 * 			- eg: class="${ condition === comparator ? 'block' : 'inline' } text-white"
	 * 			                                         ^ -> `conditional_split_character`
	 * 		- if classes are dynamically added through templating engine string interpolation (Please note classes must be surrounded by quotes ["'`])
	 * 			                         ∨-----∨ -> `must have quotes`
	 * 			- eg (vue.js): :class="{ 'block': condition } text-white"
	 * 			                                ^ -> `conditional_split_character`
	 * 			- eg (aurelia.js): class="${ 'block' | valueConverter:param1 } text-white"
	 * 			                                     ^ -> `conditional_split_character`
	 * 	"conditional_class_location" is required if classes are complex templating engine expression
	 * 	"separator" is required if classes are not separated by spaces (Separator character will also be prefixed to the first sorted class - see `pug templating language` below)
	 * 		- eg: div.before:block.before:w-2.before:h-2.block.w-4.h-4
	 * 		         ^^^^^^^^^^^^^ -> `first sorted class`
	 *
	 * Example [aurelia.js templating engine]:
	 * 	Sample HTML:
	 * 		<div class="sm:!inset-1/2 inset-y-1/2 ${ condition === comparator ? '-inset-x-px' : 'inset-x-0.5' } box-content !block -translate-x-0"></div>
	 *
	 * 	[to overwrite HTML regex defaults]
	 * 		"extensions_regex": {
	 * 			"html": {
	 * 				"region": "(?<=\\sclass=\\\")((?!\\\").)+(?=\\\")|(?<=\\sclass=')((?!').)+(?=')|(?<=@apply\\s)((?!;).)+(?=;)",
	 * 				"class": "\\$\\{\\s?[^\\}]+\\s?\\}|[^\\s]+",
	 * 				"conditional_split_character": "?",
	 * 				"conditional_class_location": "after",
	 * 			},
	 * 		},
	 */
	"extensions_regex": {
		"html": {
			"region": "(?<=\\sclass=\\\")((?!\\\").)+(?=\\\")|(?<=\\sclass=')((?!').)+(?=')|(?<=@apply\\s)((?!;).)+(?=;)",
			"class": "[^\\s]+",
		},
		"css": {
			"region": "(?<=@apply\\s)((?!;).)+(?=;)",
			"class": "[^\\s]+",
		},
		"pug": {
			"region": "\\.([a-zA-Z0-9!:_\\-\\.\\[\\]]+)",
			"class": "[^\\.]+",
			"separator": ".",
		},
	},

	/**
	 * Sorting order type
	 * Options: recess | concentric | smacss
	 */
	"order_type": "recess",

	/**
	 * Edit order
	 * Order reference
	 * 	- https://github.com/LetsZiggy/Sublime-tailwindcss-Class-Sorter/blob/main/order_list.json
	 * 	- eg: ["sr",["sr-only","not-sr-only"]]
	 * 		- ["sr",["sr-only","not-sr-only"]] -> `group`
	 * 		- "sr"                             -> `group_name`
	 * 		- ["sr-only","not-sr-only"]        -> `group_regex`
	 * 	- Grouped by the first common word of the class names (to optimize search)
	 * 	- Group_name excludes characters starting with ["!", "-", "no-", "not-", "min-", "max-", "auto-"]
	 * 	- Group_name may repeat (see ["recess" -> "content"] group_name in order_list.json)
	 * Edits will be applied in this order - "overwrite" then "amend" then "append"
	 * 	- "append" are applied in reverse order meaning there is no need to offset the indices of later "append" groups
	 *
	 * "edit_order": {
	 * 	"overwrite": [
	 * 		{
	 * 			"group_index": Index of existing group,
	 * 			"regex_list": Regex(es) to find and order each class within the group,
	 * 		},
	 * 	],
	 * 	"amend": [
	 * 		{
	 * 			"group_index": Index of existing group,
	 * 			"position": "start" | "end",
	 * 			"regex_list": Regex(es) to find and order each class within the group,
	 * 		},
	 * 	],
	 * 	"append": [
	 * 		{
	 * 			"group_index": Index of existing group,
	 * 			"group_name": New group_name (see example above for group_name),
	 * 			"position": "before" | "after",
	 * 			"append_order": Integer,
	 * 			"regex_list": Regex(es) to find and order each class within the group,
	 * 		},
	 * 	],
	 * },
	 *
	 * Explanation:
	 * 	"overwrite" the whole group in place
	 * 		- "group_index" is the index of group to be overwritten
	 * 		- "regex_list" is the list of new regex(es) to replace the `group_regex`
	 *
	 * 	"amend" to add new regex(es) to the group
	 * 		- "group_index" is the index of group to be amended
	 * 		- "position" of the new regex(es) to be added to the `group_regex`
	 * 		- "regex_list" is the list of new regex(es) to be added
	 *
	 * 	"append" to add a new group to the list
	 * 		- "group_index" of an existing group as positional reference
	 * 		- "group_name" of the new group (see example above for `group_name`)
	 * 		- "position" of the new group to be appended in relation to the reference (see "group_index" under "append")
	 * 		- "append_order": Order of new groups added if referencing the same existing group (smaller integer will appear earlier in the final order)
	 * 		- "regex_list" is the list of new regex(es) to be added
	 *
	 * Example:
	 * 	[to overwrite sorting group defaults]
	 * 	Default: {
	 * 		...
	 * 		[
	 * 			"stroke",
	 * 			[
	 * 				"stroke-(transparent|current|black|white)",
	 * 				"stroke-\\d{1,4}",
	 * 			],
	 * 		],
	 * 		...
	 * 	}
	 *
	 * 	Result: {
	 * 		...
	 * 		[
	 * 			"stroke",
	 * 			[
	 * 				"stroke-(transparent|current|black|white)",
	 * 				"stroke-\\d{1,4}",
	 * 				"stroke-opacity-\\d{1,4}",
	 * 			],
	 * 		],
	 * 		...
	 * 	}
	 *
	 * 	Setting: {
	 * 		...
	 * 		"edit_order": {
	 * 			"overwrite": [
	 * 				{
	 * 					"group_index": 114,
	 * 					"regex_list": [
	 * 						"stroke-(transparent|current|black|white)",
	 * 						"stroke-\\d{1,4}",
	 * 						"stroke-opacity-\\d{1,4}",
	 * 					],
	 * 				},
	 * 			],
	 * 		},
	 * 		...
	 * 	}
	 *
	 * 	[to add new regex rules into existing group]
	 * 	Default: {
	 * 		...
	 * 		[
	 * 			"fill",
	 * 			[
	 * 				"fill-(transparent|current|black|white)",
	 * 			],
	 * 		],
	 * 		...
	 * 	}
	 *
	 * 	Result: {
	 * 		...
	 * 		[
	 * 			"fill",
	 * 			[
	 * 				"fill-(transparent|current|black|white)",
	 * 				"fill-rule-(nonzero|evenodd)",
	 * 			],
	 * 		],
	 * 		...
	 * 	}
	 *
	 * 	Setting: {
	 * 		...
	 * 		"edit_order": {
	 * 			"amend": [
	 * 				{
	 * 					"group_index": 113,
	 * 					"position": "end",
	 * 					"regex_list": [
	 * 						fill-rule-(nonzero|evenodd)",
	 * 					],
	 * 				},
	 * 			],
	 * 		},
	 * 		...
	 * 	}
	 *
	 * 	[to add new sorting group]
	 * 	Default: {
	 * 		...
	 * 		[
	 * 			"stroke",
	 * 			[
	 * 				"stroke-(transparent|current|black|white)",
	 * 				"stroke-\\d{1,4}",
	 * 			],
	 * 		],
	 * 		...
	 * 	}
	 *
	 * 	Result: {
	 * 		...
	 * 		[
	 * 			"stroke",
	 * 			[
	 * 				"stroke-(transparent|current|black|white)",
	 * 				"stroke-\\d{1,4}",
	 * 			],
	 * 		],
	 * 		[
	 * 			"dasharray",
	 * 			[
	 * 				"dasharray-none",
	 * 			],
	 * 		],
	 * 		...
	 * 	}
	 *
	 * 	Setting: {
	 * 		...
	 * 		"edit_order": {
	 * 			"append": [
	 * 				{
	 * 					"group_index": 114,
	 * 					"group_name": "dasharray",
	 * 					"position": "after",
	 * 					"regex_list": [
	 * 						"dasharray-none",
	 * 					],
	 * 				},
	 * 			],
	 * 		},
	 * 		...
	 * 	}
	 */
	"edit_order": {
		"overwrite": [],
		"amend": [],
		"append": [],
	},

	/**
	 * Grouping of classnames
	 * Options: style | breakpoint
	 *
	 * Example [style]:
	 * 	Default: <div class="hidden bg-black sm:block"></div>
	 * 	Result: <div class="hidden sm:block bg-black"></div>
	 *
	 * Example [breakpoint]:
	 * 	Default: <div class="p-2 lg:p-6 m-2 md:m-6 lg:m-8 bg-black"></div>
	 * 	Result: <div class="p-2 m-2 bg-black md:m-6 lg:p-6 lg:m-8"></div>
	 */
	"breakpoint_grouping": "style",

	/**
	 * Reorder each classes' variants
	 * 	- https://github.com/tailwindlabs/tailwindcss-intellisense/issues/357#issuecomment-878224144
	 */
	"variant_ordering": [
		"ltr",
		"rtl",
		"data-*",
		"group-aria-*",
		"peer-aria-*",
		"aria-*",
		"aria-selected",
		"aria-required",
		"aria-readonly",
		"aria-pressed",
		"aria-hidden",
		"aria-expanded",
		"aria-disabled",
		"aria-checked",
		"supports-*",
		"print",
		"contrast-less",
		"contrast-more",
		"motion-reduce",
		"motion-safe",
		"landscape",
		"portrait",
		"dark",
		"sm",
		"md",
		"lg",
		"xl",
		"2xl",
		"min-*",
		"max-sm",
		"max-md",
		"max-lg",
		"max-xl",
		"max-2xl",
		"max-*",
		"before",
		"after",
		"group-*",
		"peer-*",
		"placeholder",
		"backdrop",
		"file",
		"selection",
		"marker",
		"first-line",
		"first-letter",
		"open",
		"read-only",
		"autofill",
		"placeholder-shown",
		"out-of-range",
		"in-range",
		"invalid",
		"valid",
		"required",
		"default",
		"indeterminate",
		"checked",
		"enabled",
		"disabled",
		"empty",
		"only-of-type",
		"last-of-type",
		"first-of-type",
		"even",
		"odd",
		"only",
		"last",
		"first",
		"target",
		"visited",
		"active",
		"focus-visible",
		"focus-within",
		"focus",
		"hover",
	],

	/**
	 * If class has no breakpoint, it will be placed last amongst similar classes
	 */
	"breakpoint_order": [
		"sm",
		"md",
		"lg",
		"xl",
		"2xl",
		"min-*",
		"max-sm",
		"max-md",
		"max-lg",
		"max-xl",
		"max-2xl",
		"max-*",
	],
}
```

This project is inspired by [headwind](https://github.com/heybourn/headwind).
