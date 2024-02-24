package main

import (
	"encoding/json"
	"fmt"

	"github.com/tidwall/jsonc"
)

func listCommand(isBase64Config, isEmbeddedConfig, isBase64Output bool, configRaw string, isEditedOrder bool) {
	var (
		defaultOrderMap    map[string]TOrderList
		configByte         []byte
		configInput        TConfigInput
		ok                 bool
		order              TOrderList
		orderIndexEdited   TOrderIndex
		orderIndexUnedited TOrderIndex
	)

	/* ---get config/order--- */
	json.Unmarshal(jsonc.ToJSON(orderListDefault), &defaultOrderMap)
	configByte = getUserConfig(configRaw, isBase64Config)
	configInput = normaliseConfig(configByte, isEmbeddedConfig, true)

	switch configInput.OrderType {
	case "custom":
		orderIndexUnedited = orderIndex(configInput.CustomOrder)
		order = normaliseOrder(configInput.CustomOrder, configInput.EditOrder)
		orderIndexEdited = orderIndex(order)

	default:
		if order, ok = defaultOrderMap[configInput.OrderType]; !ok {
			order = defaultOrderMap["recess"]
		}

		orderIndexUnedited = orderIndex(order)
		order = normaliseOrder(order, configInput.EditOrder)
		orderIndexEdited = orderIndex(order)
	}

	/* ---output--- */
	switch {
	case isBase64Output && !isEditedOrder:
		str, err := json.MarshalIndent(orderIndexUnedited, "", "\t")
		handleError(err, "base64 unedited list to JSON:", true)
		fmt.Println(encodeBase64(str, true, true))

	case isBase64Output && isEditedOrder:
		str, err := json.MarshalIndent(orderIndexEdited, "", "\t")
		handleError(err, "base64 edited list to JSON:", true)
		fmt.Println(encodeBase64(str, true, true))

	case !isBase64Output && !isEditedOrder:
		prettyPrinter(orderIndexUnedited, "", "\t")

	case !isBase64Output && isEditedOrder:
		prettyPrinter(orderIndexEdited, "", "\t")
	}
}
