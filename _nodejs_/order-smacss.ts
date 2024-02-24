/**
 * https://github.com/cahamilton/css-property-sort-order-smacss/blob/master/index.js
 * commit: d0f7f45bb51f9245bcf27de0c68ffb99b33948e0
 */

import { generator } from "./generator.js"
import baseConfig from "./stylelint-base.config.js"
import type { OrderData } from "./generator.js"
import type { Config } from "stylelint"

const order: Record<string, string[]> = {
	"content": [],
	"quotes": [],
	"display": [],
	"visibility": [],
	"position": [],
	"z-index": [],
	"inset": [], // Added
	"top": [],
	"right": [],
	"bottom": [],
	"left": [],
	"inset-block": [], // Added
	"inset-inline": [], // Added
	"inset-block-start": [], // Added
	"inset-block-end": [], // Added
	"inset-inline-start": [], // Added
	"inset-inline-end": [], // Added
	"box-sizing": [],
	"grid": [],
	"grid-after": [],
	"grid-area": [],
	"grid-auto-columns": [],
	"grid-auto-flow": [],
	"grid-auto-rows": [],
	"grid-before": [],
	"grid-column": [],
	"grid-column-end": [],
	"grid-column-gap": [],
	"grid-column-start": [],
	"grid-columns": [],
	"grid-end": [],
	"grid-gap": [],
	"grid-row": [],
	"grid-row-end": [],
	"grid-row-gap": [],
	"grid-row-start": [],
	"grid-rows": [],
	"grid-start": [],
	"grid-template": [],
	"grid-template-areas": [],
	"grid-template-columns": [],
	"grid-template-rows": [],
	"flex": [],
	"flex-basis": [],
	"flex-direction": [],
	"flex-flow": [],
	"flex-grow": [],
	"flex-shrink": [],
	"flex-wrap": [],
	"align-content": [],
	"align-items": [],
	"align-self": [],
	"justify-content": [],
	"order": [],
	"width": [],
	"min-width": [],
	"max-width": [],
	"height": [],
	"min-height": [],
	"max-height": [],
	"block-size": [],
	"min-block-size": [],
	"max-block-size": [],
	"inline-size": [],
	"min-inline-size": [],
	"max-inline-size": [],
	"margin": [],
	"margin-top": [],
	"margin-right": [],
	"margin-bottom": [],
	"margin-left": [],
	"margin-block": [],
	"margin-block-start": [],
	"margin-block-end": [],
	"margin-inline": [],
	"margin-inline-start": [],
	"margin-inline-end": [],
	"padding": [],
	"padding-top": [],
	"padding-right": [],
	"padding-bottom": [],
	"padding-left": [],
	"padding-block": [],
	"padding-block-start": [],
	"padding-block-end": [],
	"padding-inline": [],
	"padding-inline-start": [],
	"padding-inline-end": [],
	"float": [],
	"clear": [],
	"overflow": [],
	"overflow-x": [],
	"overflow-y": [],
	"overflow-block": [], // Added
	"overflow-inline": [], // Added
	"clip": [],
	"zoom": [],
	"columns": [],
	"column-gap": [],
	"column-fill": [],
	"column-rule": [],
	"column-span": [],
	"column-count": [],
	"column-width": [],
	"table-layout": [],
	"empty-cells": [],
	"caption-side": [],
	"border-spacing": [],
	"border-collapse": [],
	"list-style": [],
	"list-style-position": [],
	"list-style-type": [],
	"list-style-image": [],
	"transform": [],
	"transform-box": [],
	"transform-origin": [],
	"transform-style": [],
	"backface-visibility": [],
	"perspective": [],
	"perspective-origin": [],
	"transition": [],
	"transition-property": [],
	"transition-duration": [],
	"transition-timing-function": [],
	"transition-delay": [],
	"animation": [],
	"animation-name": [],
	"animation-duration": [],
	"animation-play-state": [],
	"animation-timing-function": [],
	"animation-delay": [],
	"animation-iteration-count": [],
	"animation-direction": [],
	"border": [],
	"border-top": [],
	"border-right": [],
	"border-bottom": [],
	"border-left": [],
	"border-block": [], // Added
	"border-inline": [], // Added
	"border-block-start": [], // Added
	"border-block-end": [], // Added
	"border-inline-start": [], // Added
	"border-inline-end": [], // Added
	"border-width": [],
	"border-top-width": [],
	"border-right-width": [],
	"border-bottom-width": [],
	"border-left-width": [],
	"border-block-width": [], // Added
	"border-inline-width": [], // Added
	"border-block-start-width": [], // Added
	"border-block-end-width": [], // Added
	"border-inline-start-width": [], // Added
	"border-inline-end-width": [], // Added
	"border-style": [],
	"border-top-style": [],
	"border-right-style": [],
	"border-bottom-style": [],
	"border-left-style": [],
	"border-block-style": [], // Added
	"border-inline-style": [], // Added
	"border-block-start-style": [], // Added
	"border-block-end-style": [], // Added
	"border-inline-start-style": [], // Added
	"border-inline-end-style": [], // Added
	"border-radius": [],
	"border-top-left-radius": [],
	"border-top-right-radius": [],
	"border-bottom-right-radius": [],
	"border-bottom-left-radius": [],
	"border-start-start-radius": [], // Added
	"border-start-end-radius": [], // Added
	"border-end-start-radius": [], // Added
	"border-end-end-radius": [], // Added
	"border-color": [],
	"border-top-color": [],
	"border-right-color": [],
	"border-bottom-color": [],
	"border-left-color": [],
	"border-block-color": [], // Added
	"border-inline-color": [], // Added
	"border-block-start-color": [], // Added
	"border-block-end-color": [], // Added
	"border-inline-start-color": [], // Added
	"border-inline-end-color": [], // Added
	"outline": [],
	"outline-color": [],
	"outline-offset": [],
	"outline-style": [],
	"outline-width": [],
	"stroke-width": [],
	"stroke-linecap": [],
	"stroke-dasharray": [],
	"stroke-dashoffset": [],
	"stroke": [],
	"opacity": [],
	"background": [],
	"background-attachment": [],
	"background-clip": [],
	"background-color": [],
	"background-image": [],
	"background-repeat": [],
	"background-position": [],
	"background-size": [],
	"box-shadow": [],
	"fill": [],
	"color": [],
	"font": [],
	"font-family": [],
	"font-size": [],
	"font-size-adjust": [],
	"font-smoothing": [],
	"font-stretch": [],
	"font-style": [],
	"font-variant": [],
	"font-weight": [],
	"font-emphasize": [],
	"font-emphasize-position": [],
	"font-emphasize-style": [],
	"letter-spacing": [],
	"line-height": [],
	// "list-style": [], // Duplicate
	"text-align": [],
	"text-align-last": [],
	"text-decoration": [],
	"text-decoration-color": [],
	"text-decoration-line": [],
	"text-decoration-style": [],
	"text-indent": [],
	"text-justify": [],
	"text-overflow": [],
	"text-overflow-ellipsis": [],
	"text-overflow-mode": [],
	"text-rendering": [],
	"text-outline": [],
	"text-shadow": [],
	"text-transform": [],
	"text-wrap": [],
	"word-wrap": [],
	"word-break": [],
	"text-emphasis": [],
	"text-emphasis-color": [],
	"text-emphasis-style": [],
	"text-emphasis-position": [],
	"vertical-align": [],
	"white-space": [],
	"word-spacing": [],
	"hyphens": [],
	"src": [],
	"tab-size": [],
	"counter-reset": [],
	"counter-increment": [],
	"resize": [],
	"cursor": [],
	"pointer-events": [],
	"speak": [],
	"user-select": [],
	"nav-index": [],
	"nav-up": [],
	"nav-right": [],
	"nav-down": [],
	"nav-left": [],
}

export async function generateSmacss (source: string, stylelintrcPath: string): Promise<Record<"order", OrderData[]>> {
	const config: Config = {
		...baseConfig,
		"extends": ["stylelint-config-property-sort-order-smacss"],
	}

	return await generator({ config, order, source, stylelintrcPath })
}
