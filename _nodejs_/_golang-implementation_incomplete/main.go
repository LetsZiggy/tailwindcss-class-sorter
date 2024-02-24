/** command: run
 * git rev-parse --show-toplevel | ( read rootpath; cd $rootpath && go run ./order-list-generator --root $rootpath --css order-list-generator/style.css && cd $rootpath/order-list-generator && rm -f ./style.css && ln -s ../dist/style.css ./ && cd $rootpath )
 *
 * --colours order-list-generator/colour-names.json
 */

/** command: build -> run
 * git rev-parse --show-toplevel | ( read rootpath; cd $rootpath && go build -o $rootpath/dist/order-list-generator ./order-list-generator && ./dist/order-list-generator --root $rootpath --css dist/style.css && cd $rootpath/order-list-generator && rm -f ./style.css && ln -s ../dist/style.css ./ && cd $rootpath )
 *
 * --colours dist/colour-names.json
 */

package main

import (
	"flag"
)

func main() {
	rootPath := flag.String("root", "", "path to root")
	cssPath := flag.String("css", "", "relative path to style.css")
	// colourNamesPath := flag.String("colours", "", "relative path to colour-names.json") // POSSIBLY NOT NEEDED
	flag.Parse()

	Prepare(*rootPath, *cssPath /**colourNamesPath,*/)
}
