# tailwindcss Class Sorter

Sorts tailwindcss classes along with their variants. If you don't care about having [variants sorted](https://github.com/tailwindlabs/tailwindcss-intellisense/issues/357#issuecomment-878224144), use the official [tailwindcss formatter](https://github.com/tailwindlabs/prettier-plugin-tailwindcss).

Comes with [recess](https://github.com/stormwarning/stylelint-config-recess-order) and [concentric](https://github.com/chaucerbao/stylelint-config-concentric-order) ordering. Or you can customise your own.

## Installation

```bash
npm install --save-dev LetsZiggy/tailwindcss-class-sorter

pnpm add --save-dev LetsZiggy/tailwindcss-class-sorter
```

## Usage

```fundamental
twcs [subcommands] [options?] [globs?]

Subcommands:
  format [options] [globs?]
    Formats files through multiple space separated file paths/globs or base64-encoded
    string input using the "--code" flag

    Options:
      --base64-config
          - if set, "--config" flag expects base64-encoded json/jsonc string
          - if not set, "--config" flag expects a valid path to json/jsonc config file
      --embedded-config
          - gets config embedded within other json files (eg. package.json)
          - if set, expects to find config in "tailwindcss_class_sorter" key/value
      --region-input
          - indicates "--code" flag is an array of regions
          - if set, "--code" flag must be set
          - if set, "--code" flag expects base64-encoded json/jsonc array of regions (strings)
      --code [string]
      		- may throw error if input string is too long
          - if "region-input" flag is set, base64-encoded array of regions (strings) to
            format and outputs to stdout
          - if "region-input" flag is not set, base64-encoded string to format and outputs
            to stdout
          - if set, file paths/globs will be ignored
          - if set, "--code-ext" flag must be set
          - if set, "--config" flag will be parsed as base64-encoded json/jsonc string
      --code-ext [string]
          - indicates the filetype of the "--code" flag base64-encoded string, eg. ["html"|"css"|"pug"]
            in the default "extensions_regex" config option
          - "--code-ext" will be used as key to "extensions_regex" config option
          - if set, "--code" flag must be set
      --config [string]
          - see https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/config.json
            for full list of config options
          - "--config" flag is optional; partial config is valid; unset config options
            will fallback to the default config values
          - if "--base64-config" flag is set, "--config" flag expects base64-encoded json/jsonc
            string
          - if "--base64-config" flag is not set, "--config" flag expects a valid path
            to json/jsonc config file

  help
    Display available subcommands and their respective options

  list [options]
    Prints out order-list in prettified json string or in base64-encoded string.
    The "--edited-order" flag will output the order-list with "edit_order" config
    option implemented. Use the unedited order-list as reference for "edit_order"
    config option

    Options:
      --base64-config
          - if set, "--config" flag expects base64-encoded json/jsonc string
          - if not set, "--config" flag expects a valid path to json/jsonc config file
      --embedded-config
          - gets config embedded within other json files (eg. package.json)
          - if set, expects to find config in "tailwindcss_class_sorter" key/value
      --base64-output
          - if set, order-list outputs as base64-encoded json/jsonc string
          - if not set, order-list outputs as tabbed json string
      --config [string]
          - see https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/config.json
            for full list of config options
          - "--config" flag is optional; partial config is valid; unset config options
            will fallback to the default config values
          - if "--base64-config" flag is set, "--config" flag expects base64-encoded json/jsonc
            string
          - if "--base64-config" flag is not set, "--config" flag expects a valid path
            to json/jsonc config file
      --edited-order
          - outputs edited order-list with indices, i.e. "edit_order" config option will
            be implemented to the order-list output
          - don't use edited order-list as reference for "edit_order" config; option instead,
            use the unedited order-list as reference by removing "--edited-order" flag
```

## Regex feature support

Uses [dlclark/regexp2](https://github.com/dlclark/regexp2) package to parse regex.

```regex
(?# ---Possessive Match--- )
(?>regex)

(?# ---Positive Lookahead--- )
(?=regex)

(?# ---Negative Lookahead--- )
(?!regex)

(?# ---Positive Lookbehind--- )
(?<=regex)

(?# ---Negative Lookbehind--- )
(?<!regex)
```

## Config ([example](https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/config.json))

### non_tailwindcss_placement

Placement of non-tailwindcss classes.

```jsonc
{
	"non_tailwindcss_placement": "front"
}
```

Options: `front` | `back`.

If `front` is selected, pseudo-elements (classes with `before:` | `after:` variants) will be placed right after non-tailwindcss classes:

```html
<div class="custom-class print:before:hover:content-['*'] print:after:hover:content-['*'] block ltr:dark:sm:block rtl:dark:2xl:block m-2 dark:sm:active:hover:m-2 dark:2xl:active:hover:m-2 text-red-50/50">
</div>
```

If `back` is selected, pseudo-elements (classes with `before:` | `after:` variants) will be placed right before non-tailwindcss classes:

```html
<div class="block ltr:dark:sm:block rtl:dark:2xl:block m-2 dark:sm:active:hover:m-2 dark:2xl:active:hover:m-2 text-red-50/50 print:before:hover:content-['*'] print:after:hover:content-['*'] custom-class">
</div>
```

### extensions_regex

Set file extensions to format.

```jsonc
{
	"extensions_regex": {
		"html": {
			"region": "(?<=\\sclass=\\\")((?!\\\").)+(?=\\\")|(?<=\\sclass=')((?!').)+(?=')|(?<=@apply\\s)((?!;).)+(?=;)",
			"class": "[^\\s]+"
		},
		"css": {
			"region": "(?<=@apply\\s)((?!;).)+(?=;)",
			"class": "[^\\s]+"
		},
		"pug": {
			"region": "\\.([a-zA-Z0-9!:_\\-\\.\\[\\]]+)",
			"class": "[^\\.]+",
			"separator": "."
		},
		"[extension]": {
			"region": "<regex>",
			"class": "<regex>",
			"separator": "<string>",
			"conditional_split_character": "<string>",
			"conditional_class_location": "<'before' | 'after'>"
		}
	}
}
```

This example uses the aurelia.js templating engine:

```html
<div class="sm:!inset-1/2 inset-y-1/2 ${ condition === comparator ? '-inset-x-px' : 'inset-x-0.5' } box-content !block -translate-x-0"></div>
```

Config for the example above:

```jsonc
{
	"extensions_regex": {
		"html": {
			"region": "(?<=\\sclass=\\\")((?!\\\").)+(?=\\\")|(?<=\\sclass=')((?!').)+(?=')|(?<=@apply\\s)((?!;).)+(?=;)",
			"class": "\\$\\{\\s?[^\\}]+\\s?\\}|[^\\s]+",
			"conditional_split_character": "?",
			"conditional_class_location": "after"
		}
	}
}
```

Explanation:

`extension` is the file type.

`region` is the regex to extract classes from files (`<div class="a b c"></div>` ➙ `"a b c"`).

`class` is the regex to extract individual class from region (`"a b c"` ➙ `["a","b","c"]`). Place more specific regex first.

`separator` is required if classes are not separated by spaces (separator character will also be prefixed to the first sorted class - see `pug templating language` below).

<strong>pug (eg)</strong>:

```pug
div.before:block.before:w-2.before:h-2.block.w-4.h-4
   ^^^^^^^^^^^^^ ➙ `this would be the first sorted class`
```

`conditional_split_character` is the character used to split ternary expression or complex class bindings by templating engine. This is required if classes are complex templating engine expression.

if classes are dynamically added through templating engine string interpolation (please note classes must be surrounded by quotes `` " | ' | ` ``):

```html
<div class="${ condition === comparator ? 'block' : 'inline' } text-white"></div>
                                        ^ ➙ `conditional_split_character`
```

<strong>vue.js (eg)</strong>:

```html
               ∨-----∨ ➙ `must have quotes`
<div :class="{ 'block': condition } text-white"></div>
                      ^ ➙ `conditional_split_character`
```

<strong>aurelia.js (eg)</strong>:

```html
               ∨-----∨ ➙ `must have quotes`
<div class="${ 'block' | valueConverter:param1 } text-white"></div>
                       ^ ➙ `conditional_split_character`
```

`conditional_class_location` can only be either `before` or `after`. It is used to determine where the classes resides in the complex expression after splitting using the `conditional_split_character`. This is required if classes are complex templating engine expression.

### order_type

Sorting order type.

```jsonc
{
	"order_type": "recess"
}
```

Options: `recess` | `concentric` | `custom`.

`custom` order type uses `custom_order` below instead of an order from [order_list.json](https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/order_list.json).

### edit_order

Edit selected order list (can also work with `"order_type": "custom"`). Run `twcs list` to get the current groups' indices.

```jsonc
{
	"edit_order": {
		"overwrite": [
			{
				"group_index": "<int>",
				"regex": "<regex array>"
			}
		],
		"amend": [
			{
				"group_index": "<int>",
				"position": "<'start' | 'end'>",
				"regex": "<regex array>"
			}
		],
		"append": [
			{
				"group_index": "<int>",
				"group_name": "<string>",
				"position": "<'before' | 'after'>",
				"append_order": "<int>",
				"regex": "<regex array>"
			}
		]
	}
}
```

Edits will be applied in the order of `overwrite` then `amend` then `append`.

`group_index` is used instead of `group_name` is because `group_name` may repeat (eg. `content` group_name in [`recess` list](https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/order_list.json)).

`append` will be applied in reverse order. There is no need to offset the `group_index` of subsequent `append` groups.

#### `overwrite`

`overwrite` the whole group's regex in place.

Example default `order_list`:

```jsonc
[
	{
		"group_name": "z",
		"regex": ["z-auto", "-{0,1}z-\\d{1,4}"]
	}
]
```

Expected edited `order_list`:

```jsonc
[
	{
		"group_name": "z",
		"regex": ["z-0", "z-1", "z-2", "z-3"]
	}
]

```

Config for the example above:

```jsonc
{
	"edit_order": {
		"overwrite": [
			{
				"group_index": 0,
				"regex": ["z-0", "z-1", "z-2", "z-3"]
			}
		]
	}
}
```

Explanation:

`group_index` is the index of existing group to be overwritten.

`regex` is the list of new regex(es) that will replace the selected group's regex list.

#### `amend`

`amend` adds new regex(es) to the group.

Example default `order_list`:

```jsonc
[
	{
		"group_name": "animate",
		"regex": ["animate-none"]
	}
]
```

Expected edited `order_list`:

```jsonc
[
	{
		"group_name": "animate",
		"regex": ["animate-wiggle", "animate-none"]
	}
]

```

Config for the example above:

```jsonc
{
	"edit_order": {
		"amend": [
			{
				"group_index": 0,
				"position": "start",
				"regex": ["animate-wiggle"]
			}
		]
	}
}
```

Explanation:

`group_index` is the index of existing group to amend.

`position` of the new regex(es) to be added to the group's regex list.

`regex` is the list of regex(es) that will be added to the selected group's regex list.

#### `append`

`append` adds new group(s) to the order list.

Example default `order_list`:

```jsonc
[
	{
		"group_name": "block",
		"regex": ["block"]
	},
	{
		"group_name": "flex",
		"regex": ["flex"]
	},
	{
		"group_name": "table",
		"regex": ["table"]
	}
]
```

Expected edited `order_list`:

```jsonc
[
	{
		"group_name": "inline",
		"regex": ["inline"]
	},
	{
		"group_name": "block",
		"regex": ["block"]
	},
	{
		"group_name": "flex",
		"regex": ["flex"]
	},
	{
		"group_name": "grid",
		"regex": ["grid"]
	},
	{
		"group_name": "table",
		"regex": ["table"]
	}
]

```

Config for the example above:

```jsonc
{
	"edit_order": {
		"append": [
			{
				"group_index": 0,
				"group_name": "inline",
				"position": "before",
				"append_order": 1,
				"regex": ["inline"]
			},
			{
				"group_index": 1,
				"group_name": "grid",
				"position": "after",
				"append_order": 2,
				"regex": ["grid"]
			}
		]
	}
}
```

Explanation:

`group_index` is the index of existing group to be used as positional reference when appending the order list. There is no need to offset the `group_index` of subsequent `append` groups.

`group_name` is the group name of the new group.

`position` of where the new group will be appended to in relation to the referenced group.

`append_order` is the order the new groups with the same `group_index` and `position` will be appended to the order list. If omitted, `append_order` defaults to 0.

`regex` is the list of regex(es) for the new group.

### breakpoint_grouping

Grouping of classes.

```jsonc
"breakpoint_grouping": "style"
```

Options: `style` | `breakpoint`.

Both grouping options will put classes without any breakpoint variant first.

The order of `breakpoint` grouping depends on `breakpoint_order` in the config.

Example:

```html
<div class="p-2 lg:p-6 m-2 md:m-6 lg:m-8 bg-hidden bg-black sm:block"></div>
```

`style`:

```html
<div class="bg-hidden sm:block p-2 lg:p-6 m-2 md:m-6 lg:m-8 bg-black"></div>
```

`breakpoint`:

```html
<div class="bg-hidden p-2 m-2 bg-black sm:block md:m-6 lg:p-6 lg:m-8"></div>
```

### variant_ordering

Ordering of variants.

```jsonc
{
	"variant_ordering": [
		/* ... */
		"ltr",
		"rtl",
		"data-*",
		"group-aria-*",
		"peer-aria-*",
		"aria-selected",
		"aria-required",
		"aria-readonly",
		"aria-pressed",
		"aria-hidden",
		"aria-expanded",
		"aria-disabled",
		"aria-checked",
		"aria-*",
		/* ... */
	]
}
```

Custom variants cannot have wildcards. Variants with wildcards, `*`, are hardcoded.

### breakpoint_order

Order of class groupings.

```jsonc
{
	"breakpoint_order": [
		/* ... */
		"sm",
		"md",
		"lg",
		"xl",
		"2xl",
		/* ... */
	]
}
```

Custom breakpoint cannot have wildcards. Breakpoint with wildcards, `*`, are hardcoded.

### custom_order

Order list used if `order_type` is set to `custom`.

```jsonc
{
	"custom_order": [
		{
			"group_name": "inset",
			"regex": [
				"inset-auto",
				"inset-x-auto",
				"inset-y-auto",
				"-{0,1}inset-full",
				"-{0,1}inset-px",
				"-{0,1}inset-\\d{1,4}\\.\\d{1,4}",
				"-{0,1}inset-\\d{1,4}\\/\\d{1,4}",
				"-{0,1}inset-\\d{1,4}",
				"-{0,1}inset-x-full",
				"-{0,1}inset-x-px",
				"-{0,1}inset-y-full",
				"-{0,1}inset-y-px",
				"-{0,1}inset-x-\\d{1,4}\\.\\d{1,4}",
				"-{0,1}inset-x-\\d{1,4}\\/\\d{1,4}",
				"-{0,1}inset-x-\\d{1,4}",
				"-{0,1}inset-y-\\d{1,4}\\.\\d{1,4}",
				"-{0,1}inset-y-\\d{1,4}\\/\\d{1,4}",
				"-{0,1}inset-y-\\d{1,4}"
			]
		},
		{
			"group_name": "<string>",
			"regex": "<regex array>"
		}
	]
}
```

`group_name` is usually the first common word of the class names. `group_name` excludes prefixes starting with `!` | `-` | `no-` | `not-` | `min-` | `max-` | `auto-` (eg. `sr` group_name in [`recess` list](https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/order_list.json)).

```jsonc
[
	{
		"group_name": "sr",
		"regex": ["sr-only", "not-sr-only"]
	}
]
```

`group_name` may repeat (eg. `content` group name in [`recess` list](https://github.com/LetsZiggy/tailwindcss-class-sorter/blob/main/dist/order_list.json)).

## FAQ

- Where is `v1.*.*` and `v2.*.*`?
	- Releases will follow tailwindcss versions.

- Are official plugins supported?
	- [Forms](https://github.com/tailwindlabs/tailwindcss-forms) and [Typography](https://github.com/tailwindlabs/tailwindcss-typography) are supported

## Development

- [lefthook](https://github.com/evilmartians/lefthook)
	- Choose one:
		- `go install github.com/evilmartians/lefthook@latest`
		- `yay -S lefthook-bin`
- [task](https://github.com/go-task/task)
	- Choose one:
		- `go install github.com/go-task/task/v3/cmd/task@latest`
		- `yay -S go-task`
