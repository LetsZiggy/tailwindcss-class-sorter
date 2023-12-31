/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-var-requires */

// https://github.com/cahamilton/css-property-sort-order-smacss/blob/master/index.js
const baseConfig = require("./.stylelintrc-base")
const { generator } = require("./generator")

const order = {
	"content": [],
	"quotes": [],
	"display": [],
	"visibility": [],
	"position": [],
	"z-index": [],
	"inset": [],
	"top": [],
	"right": [],
	"bottom": [],
	"left": [],
	"inset-block": [],
	"inset-inline": [],
	"inset-block-start": [],
	"inset-block-end": [],
	"inset-inline-start": [],
	"inset-inline-end": [],
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
	"overflow-block": [],
	"overflow-inline": [],
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
	"border-block": [],
	"border-inline": [],
	"border-block-start": [],
	"border-block-end": [],
	"border-inline-start": [],
	"border-inline-end": [],
	"border-width": [],
	"border-top-width": [],
	"border-right-width": [],
	"border-bottom-width": [],
	"border-left-width": [],
	"border-block-width": [],
	"border-inline-width": [],
	"border-block-start-width": [],
	"border-block-end-width": [],
	"border-inline-start-width": [],
	"border-inline-end-width": [],
	"border-style": [],
	"border-top-style": [],
	"border-right-style": [],
	"border-bottom-style": [],
	"border-left-style": [],
	"border-block-style": [],
	"border-inline-style": [],
	"border-block-start-style": [],
	"border-block-end-style": [],
	"border-inline-start-style": [],
	"border-inline-end-style": [],
	"border-radius": [],
	"border-top-left-radius": [],
	"border-top-right-radius": [],
	"border-bottom-right-radius": [],
	"border-bottom-left-radius": [],
	"border-start-start-radius": [],
	"border-start-end-radius": [],
	"border-end-start-radius": [],
	"border-end-end-radius": [],
	"border-color": [],
	"border-top-color": [],
	"border-right-color": [],
	"border-bottom-color": [],
	"border-left-color": [],
	"border-block-color": [],
	"border-inline-color": [],
	"border-block-start-color": [],
	"border-block-end-color": [],
	"border-inline-start-color": [],
	"border-inline-end-color": [],
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

async function generateSmacss (source, stylelintrc) {
	const config = {
		...baseConfig,
		"extends": [ "stylelint-config-property-sort-order-smacss" ],
	}

	return await generator({ config, order, src: source, stylelintrc })
}

module.exports = {
	generateSmacss,
}

const a = {
	"composes": [],
	"all": [],
	"position": [],
	"inset": [],
	"inset-block": [],
	"inset-block-start": [],
	"inset-block-end": [],
	"inset-inline": [],
	"inset-inline-start": [],
	"inset-inline-end": [],
	"top": [],
	"right": [],
	"bottom": [],
	"left": [],
	"z-index": [],
	"box-sizing": [],
	"display": [],
	"flex": [],
	"flex-basis": [],
	"flex-direction": [],
	"flex-flow": [],
	"flex-grow": [],
	"flex-shrink": [],
	"flex-wrap": [],
	"grid": [],
	"grid-area": [],
	"grid-template": [],
	"grid-template-areas": [],
	"grid-template-rows": [],
	"grid-template-columns": [],
	"grid-row": [],
	"grid-row-start": [],
	"grid-row-end": [],
	"grid-column": [],
	"grid-column-start": [],
	"grid-column-end": [],
	"grid-auto-rows": [],
	"grid-auto-columns": [],
	"grid-auto-flow": [],
	"grid-gap": [],
	"grid-row-gap": [],
	"grid-column-gap": [],
	"gap": [],
	"row-gap": [],
	"column-gap": [],
	"place-content": [],
	"place-items": [],
	"place-self": [],
	"align-content": [],
	"align-items": [],
	"align-self": [],
	"justify-content": [],
	"justify-items": [],
	"justify-self": [],
	"order": [],
	"float": [],
	"inline-size": [],
	"min-inline-size": [],
	"max-inline-size": [],
	"width": [],
	"min-width": [],
	"max-width": [],
	"height": [],
	"min-height": [],
	"max-height": [],
	"aspect-ratio": [],
	"padding": [],
	"padding-block": [],
	"padding-block-start": [],
	"padding-block-end": [],
	"padding-inline": [],
	"padding-inline-start": [],
	"padding-inline-end": [],
	"padding-top": [],
	"padding-right": [],
	"padding-bottom": [],
	"padding-left": [],
	"margin": [],
	"margin-block": [],
	"margin-block-start": [],
	"margin-block-end": [],
	"margin-inline": [],
	"margin-inline-start": [],
	"margin-inline-end": [],
	"margin-top": [],
	"margin-right": [],
	"margin-bottom": [],
	"margin-left": [],
	"overflow": [],
	"overflow-block": [],
	"overflow-inline": [],
	"overflow-x": [],
	"overflow-y": [],
	"-webkit-overflow-scrolling": [],
	"-ms-overflow-x": [],
	"-ms-overflow-y": [],
	"-ms-overflow-style": [],
	"overscroll-behavior": [],
	"overscroll-behavior-inline": [],
	"overscroll-behavior-block": [],
	"overscroll-behavior-x": [],
	"overscroll-behavior-y": [],
	"clip": [],
	"clip-path": [],
	"clear": [],
	"font": [],
	"font-family": [],
	"font-size": [],
	"font-variation-settings": [],
	"font-style": [],
	"font-weight": [],
	"font-feature-settings": [],
	"font-optical-sizing": [],
	"font-kerning": [],
	"font-variant": [],
	"font-variant-ligatures": [],
	"font-variant-caps": [],
	"font-variant-alternates": [],
	"font-variant-numeric": [],
	"font-variant-east-asian": [],
	"font-variant-position": [],
	"font-size-adjust": [],
	"font-stretch": [],
	"font-effect": [],
	"font-emphasize": [],
	"font-emphasize-position": [],
	"font-emphasize-style": [],
	"-webkit-font-smoothing": [],
	"-moz-osx-font-smoothing": [],
	"font-smooth": [],
	"hyphens": [],
	"line-height": [],
	"color": [],
	"text-align": [],
	"text-align-last": [],
	"text-emphasis": [],
	"text-emphasis-color": [],
	"text-emphasis-style": [],
	"text-emphasis-position": [],
	"text-decoration": [],
	"text-decoration-line": [],
	"text-decoration-thickness": [],
	"text-decoration-style": [],
	"text-decoration-color": [],
	"text-underline-position": [],
	"text-underline-offset": [],
	"text-indent": [],
	"text-justify": [],
	"text-outline": [],
	"-ms-text-overflow": [],
	"text-overflow": [],
	"text-overflow-ellipsis": [],
	"text-overflow-mode": [],
	"text-shadow": [],
	"text-transform": [],
	"text-wrap": [],
	"-webkit-text-size-adjust": [],
	"-ms-text-size-adjust": [],
	"letter-spacing": [],
	"word-break": [],
	"word-spacing": [],
	"word-wrap": [], // Legacy name for `overflow-wrap`
	"overflow-wrap": [],
	"tab-size": [],
	"white-space": [],
	"vertical-align": [],
	"list-style": [],
	"list-style-position": [],
	"list-style-type": [],
	"list-style-image": [],
	"src": [],
	"font-display": [],
	"unicode-range": [],
	"size-adjust": [],
	"ascent-override": [],
	"descent-override": [],
	"line-gap-override": [],
	"appearance": [],
	"accent-color": [],
	"color-scheme": [],
	"pointer-events": [],
	"-ms-touch-action": [],
	"touch-action": [],
	"cursor": [],
	"caret-color": [],
	"visibility": [],
	"zoom": [],
	"table-layout": [],
	"empty-cells": [],
	"caption-side": [],
	"border-spacing": [],
	"border-collapse": [],
	"content": [],
	"quotes": [],
	"counter-reset": [],
	"counter-set": [],
	"counter-increment": [],
	"resize": [],
	"user-select": [],
	"nav-index": [],
	"nav-up": [],
	"nav-right": [],
	"nav-down": [],
	"nav-left": [],
	"background": [],
	"background-color": [],
	"background-image": [],
	"filter:progid:DXImageTransform.Microsoft.gradient": [],
	"filter:progid:DXImageTransform.Microsoft.AlphaImageLoader": [],
	"filter": [],
	"background-repeat": [],
	"background-attachment": [],
	"background-position": [],
	"background-position-x": [],
	"background-position-y": [],
	"background-clip": [],
	"background-origin": [],
	"background-size": [],
	"background-blend-mode": [],
	"isolation": [],
	"backdrop-filter": [],
	"border": [],
	"border-color": [],
	"border-style": [],
	"border-width": [],
	"border-block": [],
	"border-block-start": [],
	"border-block-start-color": [],
	"border-block-start-style": [],
	"border-block-start-width": [],
	"border-block-end": [],
	"border-block-end-color": [],
	"border-block-end-style": [],
	"border-block-end-width": [],
	"border-inline": [],
	"border-inline-start": [],
	"border-inline-start-color": [],
	"border-inline-start-style": [],
	"border-inline-start-width": [],
	"border-inline-end": [],
	"border-inline-end-color": [],
	"border-inline-end-style": [],
	"border-inline-end-width": [],
	"border-top": [],
	"border-top-color": [],
	"border-top-style": [],
	"border-top-width": [],
	"border-right": [],
	"border-right-color": [],
	"border-right-style": [],
	"border-right-width": [],
	"border-bottom": [],
	"border-bottom-color": [],
	"border-bottom-style": [],
	"border-bottom-width": [],
	"border-left": [],
	"border-left-color": [],
	"border-left-style": [],
	"border-left-width": [],
	"border-radius": [],
	"border-start-start-radius": [],
	"border-start-end-radius": [],
	"border-end-start-radius": [],
	"border-end-end-radius": [],
	"border-top-left-radius": [],
	"border-top-right-radius": [],
	"border-bottom-right-radius": [],
	"border-bottom-left-radius": [],
	"border-image": [],
	"border-image-source": [],
	"border-image-slice": [],
	"border-image-width": [],
	"border-image-outset": [],
	"border-image-repeat": [],
	"outline": [],
	"outline-width": [],
	"outline-style": [],
	"outline-color": [],
	"outline-offset": [],
	"box-shadow": [],
	"mix-blend-mode": [],
	"filter:progid:DXImageTransform.Microsoft.Alpha(Opacity": [],
	"opacity": [],
	"-ms-interpolation-mode": [],
	"alignment-baseline": [],
	"baseline-shift": [],
	"dominant-baseline": [],
	"text-anchor": [],
	"word-spacing": [],
	"writing-mode": [],
	"fill": [],
	"fill-opacity": [],
	"fill-rule": [],
	"stroke": [],
	"stroke-dasharray": [],
	"stroke-dashoffset": [],
	"stroke-linecap": [],
	"stroke-linejoin": [],
	"stroke-miterlimit": [],
	"stroke-opacity": [],
	"stroke-width": [],
	"color-interpolation": [],
	"color-interpolation-filters": [],
	"color-profile": [],
	"color-rendering": [],
	"flood-color": [],
	"flood-opacity": [],
	"image-rendering": [],
	"lighting-color": [],
	"marker-start": [],
	"marker-mid": [],
	"marker-end": [],
	"mask": [],
	"shape-rendering": [],
	"stop-color": [],
	"stop-opacity": [],
	"transition": [],
	"transition-delay": [],
	"transition-timing-function": [],
	"transition-duration": [],
	"transition-property": [],
	"transform": [],
	"transform-origin": [],
	"rotate": [],
	"scale": [],
	"translate": [],
	"animation": [],
	"animation-name": [],
	"animation-duration": [],
	"animation-play-state": [],
	"animation-timing-function": [],
	"animation-delay": [],
	"animation-iteration-count": [],
	"animation-direction": [],
}
