/** command: run
 * git rev-parse --show-toplevel | ( read rootpath; cd $rootpath && go run ./tailwindcss-class-sorter format --base64-config --code <string> --code-ext <string> --config <string>)
 */

/** command: build -> run
 * git rev-parse --show-toplevel | ( read rootpath; cd $rootpath && go build -o $rootpath/dist/tailwindcss-class-sorter ./tailwindcss-class-sorter && ./dist/tailwindcss-class-sorter format --base64-config --code <string> --code-ext <string> --config <string>)
 */

package main

import (
	_ "embed"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"
)

//go:embed config.json
var configDefault []byte

//go:embed order_list.json
var orderListDefault []byte

func main() {
	/* ---TO DELETE--- */
	fmt.Println()
	/* ---TO COMMENT OUT--- */
	start := time.Now()

	/* ---"format" command--- */
	formatFlag := flag.NewFlagSet("format", flag.ExitOnError)
	formatIsBase64Config := formatFlag.Bool("base64-config", false, printHelp("format", "isBase64Config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatCodeInput := formatFlag.String("code", "", printHelp("format", "code", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatCodeExtensionInput := formatFlag.String("code-ext", "", printHelp("format", "codeExt", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	formatConfigInput := formatFlag.String("config", "", printHelp("format", "config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))

	/* ---"help" command--- */
	helpFlag := flag.NewFlagSet("help", flag.ExitOnError)

	/* ---"list" command--- */
	listFlag := flag.NewFlagSet("list", flag.ExitOnError)
	listIsBase64Config := listFlag.Bool("base64-config", false, printHelp("list", "isBase64Config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsBase64Output := listFlag.Bool("base64-output", false, printHelp("list", "isBase64Output", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listConfigInput := listFlag.String("config", "", printHelp("list", "config", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))
	listIsShowEditedOrder := listFlag.Bool("show-edited-order", false, printHelp("list", "showEditedOrder", true, "\n", "  ", 0, 0, 0, 1, true, "- ", 80))

	switch {
	case len(os.Args) < 2:
		defer func() {
			os.Exit(1)
		}()

		helpCommand(false)

	case os.Args[1] == "format":
		defer func() {
			os.Exit(0)
		}()

		formatFlag.Parse(os.Args[2:])

		codeInputLen := len(*formatCodeInput)
		codeExtensionInputLen := len(*formatCodeExtensionInput)
		filepaths := formatFlag.Args()
		args := strings.Join(filepaths, " ")

		switch {
		/* ---check base64 input--- */
		case (codeInputLen > 0 && codeExtensionInputLen == 0) || (codeInputLen == 0 && codeExtensionInputLen > 0):
			err := makeError("\"--code\" and \"--code-ext\" must be set together")
			handleError(err, "flags error", true)

		/* ---handle base64 input--- */
		case codeInputLen > 0 && codeExtensionInputLen > 0:
			formatCommand(*formatIsBase64Config, *formatCodeInput, *formatCodeExtensionInput, []string{}, *formatConfigInput)

		/* ---check globs/filepaths input - no globs/filepaths--- */
		case len(args) == 0:
			err := makeError("no globs/filepaths provided")
			handleError(err, "args error", true)

		/* ---check globs/filepaths input - flags after globs/filepaths--- */
		case strings.Contains(args, " -"):
			err := makeError("place flags before globs/filepaths: " + args)
			handleError(err, "args error", true)

		/* ---handles globs/filepaths input--- */
		default:
			formatCommand(*formatIsBase64Config, "", "", filepaths, *formatConfigInput)

		}

	case os.Args[1] == "help":
		defer func() {
			os.Exit(0)
		}()

		helpFlag.Parse(os.Args[2:])

		helpCommand(true)

	case os.Args[1] == "list":
		defer func() {
			os.Exit(0)
		}()

		listFlag.Parse(os.Args[2:])

		listCommand(*listIsBase64Config, *listIsBase64Output, *listConfigInput, *listIsShowEditedOrder)

	default:
		defer func() {
			os.Exit(1)
		}()

		helpCommand(false)
	}

	/* ---TO COMMENT OUT--- */
	fmt.Printf(">>> tailwind-class-sorter: %v\n", time.Since(start))
	return
}

/*
PCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PG1ldGEgY2hhcnNldD0idXRmLTgiPjxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MSI+PC9oZWFkPjxib2R5PjxkaXYgY2xhc3M9IiAgZGFyazoyeGw6YWN0aXZlOmhvdmVyOm0tMiAgIHJ0bDpkYXJrOjJ4bDpibG9jayAgIHRleHQtcmVkLTUwLzUwICAgYmxvY2sgICBwcmludDpiZWZvcmU6aG92ZXI6Y29udGVudC1bJyonXSAgIG0tMiAgIGRhcms6c206YWN0aXZlOmhvdmVyOm0tMiAgIGN1c3RvbS1jbGFzcyAgIGx0cjpkYXJrOnNtOmJsb2NrICAgcHJpbnQ6YWZ0ZXI6aG92ZXI6Y29udGVudC1bJyonXSAgIj48L2Rpdj48ZGl2IGNsYXNzPSIgICAyeGw6WyY6bnRoLWNoaWxkKDEpXTpbQHN1cHBvcnRzKGJhY2tkcm9wLWZpbHRlcjpibHVyKDApKV06dG9wLVs1cHhdICBjdXN0b20tY2xhc3MgIHNtOlsmOm50aC1jaGlsZCgxKV06W0BzdXBwb3J0cyhiYWNrZHJvcC1maWx0ZXI6Ymx1cigwKSldOnRvcC1bNXB4XSAgWyY6bnRoLWNoaWxkKDEpXTpbQHN1cHBvcnRzKGJhY2tkcm9wLWZpbHRlcjpibHVyKDApKV06YWZ0ZXI6dG9wLVs1cHhdICBbJjpudGgtY2hpbGQoMSldOltAc3VwcG9ydHMoYmFja2Ryb3AtZmlsdGVyOmJsdXIoMCkpXTp0b3AtWzVweF0gIFsmOm50aC1jaGlsZCgxKV06W0BzdXBwb3J0cyhiYWNrZHJvcC1maWx0ZXI6Ymx1cigwKSldOmJlZm9yZTp0b3AtWzVweF0gICAiPjwvZGl2PjxkaXYgY2xhc3M9IiAgcGVlci9pZGVudGlmaWVyOmxnOm0tMiAgIG1heC1bNXB4XTpibG9jayAgIHBlZXItYXJpYS1bc29ydD1hc2NlbmRpbmddOmxnOmJnLVt1cmwoJ2ltZy5zdmcnKV0gICBzbTpibG9jayAgIGxnOmFyaWEtW3NvcnQ9YXNjZW5kaW5nXTpiZy1bdXJsKCdpbWcuc3ZnJyldICAgcGVlci1bLmlzLWJvb2xdOmxnOm0tMiAgIG1heC1bNXB4XTptZDptYXgtbWQ6bWF4LTJ4bDoyeGw6bGc6bWF4LXhsOm1heC1sZzp4bDpzbTptYXgtc206bWluLVs1cHhdOnRleHQtcmVkLTUwLzUwICAgZ3JvdXAtYXJpYS1bc29ydD1hc2NlbmRpbmddOmxnOmJnLVt1cmwoJ2ltZy5zdmcnKV0gICBtYXgtc206YmxvY2sgICBwZWVyLVs6bnRoLW9mLXR5cGUoMSlfJl06bGc6bS0yICAgbGc6YXJpYS1jaGVja2VkOm0tMiAgIGdyb3VwLWhvdmVyL2lkZW50aWZpZXI6bGc6bS0yICAgcGVlci1ob3Zlci9pZGVudGlmaWVyOmxnOm0tMiAgIDJ4bDpibG9jayAgIGdyb3VwLVs6bnRoLW9mLXR5cGUoMSlfJl06bGc6bS0yICAgZ3JvdXAvaWRlbnRpZmllcjpsZzptLTIgICBtYXgtMnhsOmJsb2NrICAgY3VzdG9tLWNsYXNzICAgZ3JvdXAtWy5pcy1ib29sXTpsZzptLTIgICBzdXBwb3J0cy1bYmFja2Ryb3AtZmlsdGVyXTpsZzptLTIgICBibG9jayAgIHN1cHBvcnRzLVtkaXNwbGF5OmdyaWRdOmxnOm0tMiAgIG1pbi1bNXB4XTpibG9jayAgIGRhdGEtW3NpemU9bGFyZ2VdOmxnOm0tMiAgIj48L2Rpdj48ZGl2IGNsYXNzPSIgICAgYm9yZGVyLXMtcmVkLTUwMCAgc3RhcnQtNSAgcGUtNSAgcm91bmRlZC1lZSAgcm91bmRlZC1zcyBib3JkZXItcy01IG1zLTUgdmlhLTMwJSBiZy1wdXJwbGUtNDAwLzIwIHNjcm9sbC1wZS01IHNjcm9sbC1tcy01IGVuZC01IHRvLTkwJSAgICAgdGV4dC1zbS9bNXB4XSAgICAgcm91bmRlZC1lcyAgICAgcHMtNSAgICAgcm91bmRlZC1zICAgICBzY3JvbGwtbWUtNSBzY3JvbGwtcHMtNSBtZS01IHRleHQtbGcvNSAgICAgbGlzdC1pbWFnZS1bdXJsKCdjYXJyb3QucG5nJyldICAgICByb3VuZGVkLWUgICAgIHJvdW5kZWQtc2UgICAgIGJvcmRlci1lLXJlZC01MDAgYm9yZGVyLWUtNSBsaW5lLWNsYW1wLTMgcm91bmRlZC1bNXB4XSBmcm9tLTEwJSBmcm9tLVs1LjUlXSBjdXN0b20tY2xhc3MgICBpbnNldC01ICAgICI+PC9kaXY+PC9ib2R5PjwvaHRtbD4=

<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div class="  dark:2xl:active:hover:m-2   rtl:dark:2xl:block   text-red-50/50   block   print:before:hover:content-['*']   m-2   dark:sm:active:hover:m-2   custom-class   ltr:dark:sm:block   print:after:hover:content-['*']  "></div><div class="   2xl:[&:nth-child(1)]:[@supports(backdrop-filter:blur(0))]:top-[5px]  custom-class  sm:[&:nth-child(1)]:[@supports(backdrop-filter:blur(0))]:top-[5px]  [&:nth-child(1)]:[@supports(backdrop-filter:blur(0))]:after:top-[5px]  [&:nth-child(1)]:[@supports(backdrop-filter:blur(0))]:top-[5px]  [&:nth-child(1)]:[@supports(backdrop-filter:blur(0))]:before:top-[5px]   "></div><div class="  peer/identifier:lg:m-2   max-[5px]:block   peer-aria-[sort=ascending]:lg:bg-[url('img.svg')]   sm:block   lg:aria-[sort=ascending]:bg-[url('img.svg')]   peer-[.is-bool]:lg:m-2   max-[5px]:md:max-md:max-2xl:2xl:lg:max-xl:max-lg:xl:sm:max-sm:min-[5px]:text-red-50/50   group-aria-[sort=ascending]:lg:bg-[url('img.svg')]   max-sm:block   peer-[:nth-of-type(1)_&]:lg:m-2   lg:aria-checked:m-2   group-hover/identifier:lg:m-2   peer-hover/identifier:lg:m-2   2xl:block   group-[:nth-of-type(1)_&]:lg:m-2   group/identifier:lg:m-2   max-2xl:block   custom-class   group-[.is-bool]:lg:m-2   supports-[backdrop-filter]:lg:m-2   block   supports-[display:grid]:lg:m-2   min-[5px]:block   data-[size=large]:lg:m-2  "></div><div class="    border-s-red-500  start-5  pe-5  rounded-ee  rounded-ss border-s-5 ms-5 via-30% bg-purple-400/20 scroll-pe-5 scroll-ms-5 end-5 to-90%     text-sm/[5px]     rounded-es     ps-5     rounded-s     scroll-me-5 scroll-ps-5 me-5 text-lg/5     list-image-[url('carrot.png')]     rounded-e     rounded-se     border-e-red-500 border-e-5 line-clamp-3 rounded-[5px] from-10% from-[5.5%] custom-class   inset-5    "></div></body></html>
*/
