package main

import (
	"encoding/json"
	"fmt"
	"os"
	fp "path/filepath"
	"strings"
)

func GetPath(rootPath, filePath string) string {
	var trimmed string
	var found bool

	// strings.LastIndex(rootPath, `/`) == len(rootPath)-1
	trimmed, found = strings.CutSuffix(rootPath, `/`)
	if found {
		rootPath = trimmed
	}

	// strings.LastIndex(rootPath, `\`) == len(rootPath)-1
	trimmed, found = strings.CutSuffix(rootPath, `\`)
	if found {
		rootPath = trimmed
	}

	// strings.Index(filePath, `/`) == 0
	trimmed, found = strings.CutPrefix(filePath, `/`)
	if found {
		filePath = trimmed
	}

	// strings.Index(filePath, `\`) == 0
	trimmed, found = strings.CutPrefix(filePath, `\`)
	if found {
		filePath = trimmed
	}

	return fp.Join(rootPath, filePath)
}

func HandleError(err error, s string) {
	if err != nil {
		if len(s) > 0 {
			fmt.Print(s + " --- ")
		}

		panic(err)
	}
}

func GetFile(path string) []byte {
	content, err := os.ReadFile(path)
	HandleError(err, "getFile<"+path+">")

	return content
}

func UnmarshalJson(path string, variable *[]string) {
	jsonFile := GetFile(path)

	err := json.Unmarshal(jsonFile, &variable)
	HandleError(err, "unmarshalJson")
}
