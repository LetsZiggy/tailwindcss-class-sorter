package main

import (
	"encoding/json"
	"fmt"

	"github.com/tidwall/jsonc"
)

func listCommand(isBase64Config, isBase64Output bool, configRaw string, isShowEditedOrder bool) {
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
	configInput = normaliseConfig(configByte, true)

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
	case isBase64Output && !isShowEditedOrder:
		str, err := json.MarshalIndent(orderIndexUnedited, "", "\t")
		handleError(err, "base64 unedited list to JSON:", true)

		fmt.Println(encodeBase64(str, true, true))

	case isBase64Output && isShowEditedOrder:
		str, err := json.MarshalIndent(orderIndexEdited, "", "\t")
		handleError(err, "base64 edited list to JSON:", true)

		fmt.Println(encodeBase64(str, true, true))

	case !isBase64Output && !isShowEditedOrder:
		prettyPrinter(orderIndexUnedited, "", "\t")

	case !isBase64Output && isShowEditedOrder:
		prettyPrinter(orderIndexEdited, "", "\t")
	}
}
