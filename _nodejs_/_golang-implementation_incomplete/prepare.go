package main

import (
	"fmt"
	"os"
	re "regexp"
	"strings"
	"time"
	// re "github.com/dlclark/regexp2"
)

var (
	reCompiled01  *re.Regexp = re.MustCompile(`(?:(?:^|(?:[^;][^\s]))/\*[\s\w!"#'()*,./:<=>?` + "`" + `|\-]+\*/)|(?:[^,]/\*[\s\w!"#'()*,./:<=>?` + "`" + `|\-]+\*/)|(?:[^/][^\*][^!][^\*][^/][^\s]/\*[\s\w!"#'()*,./:<=>?` + "`" + `|\-]+\*/)`) // re.ECMAScript
	replacement01 []byte     = []byte("")

	reCompiled02  *re.Regexp = re.MustCompile(`{\n`) // re.ECMAScript
	replacement02 []byte     = []byte("{ ")

	reCompiled03  *re.Regexp = re.MustCompile(`\n}`) // re.ECMAScript
	replacement03 []byte     = []byte(" }")

	reCompiled04  *re.Regexp = re.MustCompile(`(;|:|,|\*/)\s+`) // re.ECMAScript
	replacement04 []byte     = []byte("${1} ")

	reCompiled05  *re.Regexp = re.MustCompile(`[\t ]+`) // re.ECMAScript
	replacement05 []byte     = []byte(" ")

	reCompiled06  *re.Regexp = re.MustCompile(`\n+`) // re.ECMAScript
	replacement06 []byte     = []byte("\n")

	reCompiled07  *re.Regexp = re.MustCompile(`([a-z\d])(?::{1,2}[a-z\-]+)(,|(?:\s{))`) // re.ECMAScript
	replacement07 []byte     = []byte("${1}${2}")

	reCompiled08a *re.Regexp = re.MustCompile(`(\s)(?:(?:-?\.?\d+\.\d+)|(?:-?\.?\d+))((?:\s\d+)|(?:\sauto)|(?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%|(?:\s-)|(?:\s\/)|;)`)  // re.ECMAScript
	reCompiled08b *re.Regexp = re.MustCompile(`(0\s)(?:(?:-?\.?\d+\.\d+)|(?:-?\.?\d+))((?:\s\d+)|(?:\sauto)|(?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%|(?:\s-)|(?:\s\/)|;)`) // re.ECMAScript
	replacement08 []byte     = []byte("${1}0${2}")

	reCompiled09  *re.Regexp = re.MustCompile(`(\()(?:(?:-?\.?\d+\.\d+)|(?:-?\.?\d+))(((?:\s\d+)|(?:\sauto)|(?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%|(?:\s-))?((?:\s[^{])|(?:[),])|(?:\s\d)))`) // re.ECMAScript
	replacement09 []byte     = []byte("${1}0${2}")

	reCompiled10  *re.Regexp = re.MustCompile(`(\()(?: ?(?:(?:\d+\.\d+)|\d+), ?(?:(?:\d+\.\d+)|\d+), ?(?:(?:\d+\.\d+)|\d+))( ?\)|,)`) // re.ECMAScript
	replacement10 []byte     = []byte("${1}0,0,0${2}")

	reCompiled11  *re.Regexp = re.MustCompile(`(\()(?: ?(?:(?:\d+\.\d+)|\d+), ?(?:(?:\d+\.\d+)|\d+), ?(?:(?:\d+\.\d+)|\d+), ?(?:(?:\d+\.\d+)|\d+))( ?\)|,)`) // re.ECMAScript
	replacement11 []byte     = []byte("${1}0,0,0,0${2}")

	reCompiled12  *re.Regexp = re.MustCompile(`(\s|\(|,|:)(?:(?:\d+\.\d+)|\d+)(?:(?:vh)|(?:vw)|(?:ch)|(?:rem)|(?:em)|(?:px)|(?:fr)|(?:deg)|s|(?:ms)|%)(\s|\)|,|;)`) // re.ECMAScript
	replacement12 []byte     = []byte("${1}0${2}")

	reCompiled13  *re.Regexp = re.MustCompile(`(#)\w{3,6}(\s|\)|,|;)`) // re.ECMAScript
	replacement13 []byte     = []byte("${1}000${2}")

	reCompiled14  *re.Regexp = re.MustCompile(`(-)\d+((?:xl)|:|(?:\s>)|(?:\s{))`) // re.ECMAScript
	replacement14 []byte     = []byte("${1}0${2}")

	reCompiled15  *re.Regexp = re.MustCompile(`rgb\((?:\d+ ?){3}\/ (?:(?:\d{1,4}\.?\d{0,4})|[\d()a-z\-]+)\)([; ])`) // re.ECMAScript
	replacement15 []byte     = []byte("rgb(0 0 0 / 0)${1}")

	reCompiled16  *re.Regexp = re.MustCompile(`(-[A-Za-z]+)\\/\d+((?:xl)|:|(?:\s>)|(?:\s{))`) // re.ECMAScript
	replacement16 []byte     = []byte("${1}\\/5${2}")

	reCompiled17  *re.Regexp = re.MustCompile(`(-)\d+\\/\d+((?:xl)|:|(?:\s>)|(?:\s{))`) // re.ECMAScript
	replacement17 []byte     = []byte("${1}0\\/5${2}")

	reCompiled18  *re.Regexp = re.MustCompile(`(-)\d+\\\.\d+((?:xl)|:|(?:\s>)|(?:\s{))`) // re.ECMAScript
	replacement18 []byte     = []byte("${1}0\\.5${2}")

	// reCompiled19  *re.Regexp = re.MustCompile(`(?i)` + fmt.Sprintf("(%s)", colourNames)) // re.ECMAScript // POSSIBLY NOT NEEDED
	// replacement19 []byte     = []byte("<strings.ToLower>") // POSSIBLY NOT NEEDED

	reCompiled20  *re.Regexp = re.MustCompile(`(\.w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement20 []byte     = []byte("${1}width: 0;${2}")

	reCompiled21  *re.Regexp = re.MustCompile(`(\.min-w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement21 []byte     = []byte("${1}min-width: 0;${2}")

	reCompiled22  *re.Regexp = re.MustCompile(`(\.max-w-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement22 []byte     = []byte("${1}max-width: 0;${2}")

	reCompiled23  *re.Regexp = re.MustCompile(`(\.h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement23 []byte     = []byte("${1}height: 0;${2}")

	reCompiled24  *re.Regexp = re.MustCompile(`(\.min-h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement24 []byte     = []byte("${1}min-height: 0;${2}")

	reCompiled25  *re.Regexp = re.MustCompile(`(\.max-h-(?:(?:min)|(?:max)|(?:fit))\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement25 []byte     = []byte("${1}max-height: 0;${2}")

	reCompiled26  *re.Regexp = re.MustCompile(`(\.-?inset-[\d./\\a-z-]+\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement26 []byte     = []byte("${1}inset: 0;${2}")

	reCompiled27  *re.Regexp = re.MustCompile(`(\.-?m[xy]-[\d./\\a-z]+\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement27 []byte     = []byte("${1}margin: 0;${2}")

	reCompiled28  *re.Regexp = re.MustCompile(`(\.-?space-[xy]-[\d./\\a-z]+\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement28 []byte     = []byte("${1}margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;${2}")

	reCompiled29  *re.Regexp = re.MustCompile(`(\.p[xy]-[\d./\\a-z]+\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement29 []byte     = []byte("${1}padding: 0;${2}")

	reCompiled30  *re.Regexp = re.MustCompile(`(\.border-opacity-[\d./\\a-z]+\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement30 []byte     = []byte("${1}border-color: rgba(0,0,0,0);${2}")

	reCompiled31  *re.Regexp = re.MustCompile(`(\.divide-[xy](?:-[\da-z]+)?\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement31 []byte     = []byte("${1}border-width: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0;${2}")

	reCompiled32  *re.Regexp = re.MustCompile(`(\.divide-opacity-[\d./\\a-z]+\s>\s:not\(\[hidden]\)\s~\s:not\(\[hidden]\)\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement32 []byte     = []byte("${1}border-color: rgba(0,0,0,0);${2}")

	reCompiled33  *re.Regexp = re.MustCompile(`(\.bg-opacity-[\d./\\a-z]+\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement33 []byte     = []byte("${1}background-color: rgba(0,0,0,0);${2}")

	reCompiled34  *re.Regexp = re.MustCompile(`(\.text-opacity-[\d./\\a-z]+\s{\s)[^}]+(\s})`) // re.ECMAScript
	replacement34 []byte     = []byte("${1}color: rgba(0,0,0,0);${2}")
)

func regexpCss(css string) string {
	cssByte := []byte(css)
	// var err error

	cssByte = reCompiled01.ReplaceAll(cssByte, replacement01)
	// css, err = reCompiled01.Replace(css, replacement01, -1, -1)
	// handleError(err, "Removes outer comments (leaves comments in styles alone)")

	cssByte = reCompiled02.ReplaceAll(cssByte, replacement02)
	// css, err = reCompiled02.Replace(css, replacement02, -1, -1)
	// handleError(err, "Removes newline after `{`")

	cssByte = reCompiled03.ReplaceAll(cssByte, replacement03)
	// css, err = reCompiled03.Replace(css, replacement03, -1, -1)
	// handleError(err, "Removes newline before `}`")

	cssByte = reCompiled04.ReplaceAll(cssByte, replacement04)
	// css, err = reCompiled04.Replace(css, replacement04, -1, -1)
	// handleError(err, "Removes newline after ; | : | , | */ (end of comment in styles)")

	cssByte = reCompiled05.ReplaceAll(cssByte, replacement05)
	// css, err = reCompiled05.Replace(css, replacement05, -1, -1)
	// handleError(err, "Trims spaces")

	cssByte = reCompiled06.ReplaceAll(cssByte, replacement06)
	// css, err = reCompiled06.Replace(css, replacement06, -1, -1)
	// handleError(err, "Trims newlines")

	/* --- --- --- --- --- */

	cssByte = reCompiled07.ReplaceAll(cssByte, replacement07)
	// css, err = reCompiled07.Replace(css, replacement07, -1, -1)
	// handleError(err, "Removes vendor-prefixes")

	cssByte = reCompiled08a.ReplaceAll(cssByte, replacement08)
	cssByte = reCompiled08b.ReplaceAll(cssByte, replacement08)
	// css, err = reCompiled08.Replace(css, replacement08, -1, -1)
	// handleError(err, "Convert integer/float css values to `0`")

	cssByte = reCompiled09.ReplaceAll(cssByte, replacement09)
	// css, err = reCompiled09.Replace(css, replacement09, -1, -1)
	// handleError(err, "Convert all single args integer/float to `0`")

	cssByte = reCompiled10.ReplaceAll(cssByte, replacement10)
	// css, err = reCompiled10.Replace(css, replacement10, -1, -1)
	// handleError(err, "Convert all triple args integer/float to `0,0,0`")

	cssByte = reCompiled11.ReplaceAll(cssByte, replacement11)
	// css, err = reCompiled11.Replace(css, replacement11, -1, -1)
	// handleError(err, "Convert all quadruple args integer/float to `0,0,0,0`")

	cssByte = reCompiled12.ReplaceAll(cssByte, replacement12)
	// css, err = reCompiled12.Replace(css, replacement12, -1, -1)
	// handleError(err, "Remove all value units")

	cssByte = reCompiled13.ReplaceAll(cssByte, replacement13)
	// css, err = reCompiled13.Replace(css, replacement13, -1, -1)
	// handleError(err, "Convert all hex to `000`")

	cssByte = reCompiled14.ReplaceAll(cssByte, replacement14)
	// css, err = reCompiled14.Replace(css, replacement14, -1, -1)
	// handleError(err, "Convert classes ending with number to `0`")

	cssByte = reCompiled15.ReplaceAll(cssByte, replacement15)
	// css, err = reCompiled15.Replace(css, replacement15, -1, -1)
	// handleError(err, "Convert rgb() to `rgb(0 0 0 / 0)`")

	cssByte = reCompiled16.ReplaceAll(cssByte, replacement16)
	// css, err = reCompiled16.Replace(css, replacement16, -1, -1)
	// handleError(err, "Convert classes ending with fraction to `0\\/5`")

	cssByte = reCompiled17.ReplaceAll(cssByte, replacement17)
	// css, err = reCompiled17.Replace(css, replacement17, -1, -1)
	// handleError(err, "Convert classes ending with fraction to `0\\/5`")

	cssByte = reCompiled18.ReplaceAll(cssByte, replacement18)
	// css, err = reCompiled18.Replace(css, replacement18, -1, -1)
	// handleError(err, "Convert classes ending with float to `0\\.5`")

	// css = reCompiled19.ReplaceAllStringFunc(css, strings.ToLower)
	// css, err = reCompiled19.ReplaceFunc(css, func(match re.Match) string {
	// 	return strings.ToLower(match.Group.Capture.String())
	// }, -1, -1)
	// handleError(err, "Lowercase all colour classes")

	cssByte = reCompiled20.ReplaceAll(cssByte, replacement20)
	// css, err = reCompiled20.Replace(css, replacement20, -1, -1)
	// handleError(err, "Convert `w-(min|max|fit)` classes styles to `width: 0;`")

	cssByte = reCompiled21.ReplaceAll(cssByte, replacement21)
	// css, err = reCompiled21.Replace(css, replacement21, -1, -1)
	// handleError(err, "Convert `min-w-(min|max|fit)` classes styles to `min-width: 0;`")

	cssByte = reCompiled22.ReplaceAll(cssByte, replacement22)
	// css, err = reCompiled22.Replace(css, replacement22, -1, -1)
	// handleError(err, "Convert `max-w-(min|max|fit)` classes styles to `max-width: 0;`")

	cssByte = reCompiled23.ReplaceAll(cssByte, replacement23)
	// css, err = reCompiled23.Replace(css, replacement23, -1, -1)
	// handleError(err, "Convert `h-(min|max|fit)` classes styles to `height: 0;`")

	cssByte = reCompiled24.ReplaceAll(cssByte, replacement24)
	// css, err = reCompiled24.Replace(css, replacement24, -1, -1)
	// handleError(err, "Convert `min-h-(min|max|fit)` classes styles to `min-height: 0;`")

	cssByte = reCompiled25.ReplaceAll(cssByte, replacement25)
	// css, err = reCompiled25.Replace(css, replacement25, -1, -1)
	// handleError(err, "Convert `max-h-(min|max|fit)` classes styles to `max-height: 0;`")

	cssByte = reCompiled26.ReplaceAll(cssByte, replacement26)
	// css, err = reCompiled26.Replace(css, replacement26, -1, -1)
	// handleError(err, "Convert all inset classes styles to `inset: 0;`")

	cssByte = reCompiled27.ReplaceAll(cssByte, replacement27)
	// css, err = reCompiled27.Replace(css, replacement27, -1, -1)
	// handleError(err, "Convert all `mx|my` classes styles to `margin: 0;`")

	cssByte = reCompiled28.ReplaceAll(cssByte, replacement28)
	// css, err = reCompiled28.Replace(css, replacement28, -1, -1)
	// handleError(err, "Convert all space classes styles to `margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;`")

	cssByte = reCompiled29.ReplaceAll(cssByte, replacement29)
	// css, err = reCompiled29.Replace(css, replacement29, -1, -1)
	// handleError(err, "Convert all `px|py` classes styles to `padding: 0;`")

	cssByte = reCompiled30.ReplaceAll(cssByte, replacement30)
	// css, err = reCompiled30.Replace(css, replacement30, -1, -1)
	// handleError(err, "Convert all border-opacity classes styles to `border-color: rgba(0,0,0,0);`")

	cssByte = reCompiled31.ReplaceAll(cssByte, replacement31)
	// css, err = reCompiled31.Replace(css, replacement31, -1, -1)
	// handleError(err, "Convert all divide classes styles to `border-width: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0;`")

	cssByte = reCompiled32.ReplaceAll(cssByte, replacement32)
	// css, err = reCompiled32.Replace(css, replacement32, -1, -1)
	// handleError(err, "Convert all divide-opacity classes styles to `border-color: rgba(0,0,0,0);`")

	cssByte = reCompiled33.ReplaceAll(cssByte, replacement33)
	// css, err = reCompiled33.Replace(css, replacement33, -1, -1)
	// handleError(err, "Convert all bg-opacity classes styles to `background-color: rgba(0,0,0,0);`")

	cssByte = reCompiled34.ReplaceAll(cssByte, replacement34)
	// css, err = reCompiled34.Replace(css, replacement34, -1, -1)
	// handleError(err, "Convert all text-opacity classes styles to `color: rgba(0,0,0,0);`")

	return string(cssByte)
}

func Prepare(rootPath, cssPath /*colourNamesPath, */ string) {
	start := time.Now()

	css := string(GetFile(GetPath(rootPath, cssPath)))

	/* POSSIBLY NOT NEEDED */
	// var colourNamesArray []string
	// unmarshalJson(getPath(rootPath, colourNamesPath), &colourNamesArray)
	// colourNames := strings.Join(colourNamesArray, "|")

	css = regexpCss(css)

	var cssSetArr []string
	cssRawArr := strings.Split(css, "\n")
	cssMap := make(map[string]struct{})

	for _, str := range cssRawArr {
		if strings.Index(str, ".") == 0 {
			if _, ok := cssMap[str]; !ok {
				cssMap[str] = struct{}{}
				cssSetArr = append(cssSetArr, str)
			}
		}
	}

	css = strings.Join(cssSetArr, "\n")

	outfile, err := os.Create(GetPath(rootPath, cssPath))
	HandleError(err, "os.Create")
	defer func() {
		err = outfile.Close()
		HandleError(err, "os.Close")
	}()

	outfile.WriteString(css)

	fmt.Printf(">>> order-list-generator<prepare>: %v\n", time.Since(start))
}
