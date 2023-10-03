package main

import (
	"encoding/json"
	"fmt"

	"github.com/tidwall/jsonc"
)

func listCommand(configInput string, isBase64, isShowEditedOrder bool) {
	var (
		defaultOrderMap map[string]TOrder
		configByte      []byte
		config          TConfig
		order           TOrder
		uneditedOutput  TOrderIndex
		editedOutput    TOrderIndex
	)
	json.Unmarshal(jsonc.ToJSON(orderListDefault), &defaultOrderMap)
	switch isBase64 {
	case true:
		configByte = decodeBase64(configInput, false)

	case false:
		configByte = getFile(configInput, false)
	}
	config = normaliseConfig(configByte)
	switch config.OrderType {
	case "custom":
		uneditedOutput = orderIndex(config.CustomOrder)
		order = normaliseOrder(config.CustomOrder, config.EditOrder)
		editedOutput = orderIndex(order)
	default:
		var ok bool
		if order, ok = defaultOrderMap[config.OrderType]; !ok {
			order = defaultOrderMap["recess"]
		}
		uneditedOutput = orderIndex(order)
		order = normaliseOrder(order, config.EditOrder)
		editedOutput = orderIndex(order)
	}
	switch {
	case isBase64 && !isShowEditedOrder:
		str, err := json.MarshalIndent(uneditedOutput, "", "\t")
		handleError(err, "base64 unedited list to JSON:", true)
		fmt.Println(encodeBase64(str, true))

	case isBase64 && isShowEditedOrder:
		str, err := json.MarshalIndent(editedOutput, "", "\t")
		handleError(err, "base64 edited list to JSON:", true)
		fmt.Println(encodeBase64(str, true))

	case !isBase64 && !isShowEditedOrder:
		prettyPrinter(uneditedOutput, "", "\t")

	case !isBase64 && isShowEditedOrder:
		prettyPrinter(editedOutput, "", "\t")
	}
	return
}
