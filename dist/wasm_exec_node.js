#!/usr/bin/env -S node --stack-size=8192
// Copyright 2021 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

"use strict";

/*
if (process.argv.length < 3) {
	console.error("usage: go_js_wasm_exec [wasm binary] [arguments]");
	process.exit(1);
}
*/

globalThis.require = require;
globalThis.fs = require("fs");
globalThis.TextEncoder = require("util").TextEncoder;
globalThis.TextDecoder = require("util").TextDecoder;

globalThis.performance ??= require("performance");

globalThis.crypto ??= require("crypto");

require("./wasm_exec");

const argv = [
	(process.argv[1].includes("/dist/"))
		? process.argv[1]
			.replace("/wasm_exec_node.js", "/twcs.wasm")
		: process.argv[1]
			.replace("/.bin/twcs", "/tailwindcss-class-sorter/dist/twcs.wasm")
			.replace("/.bin/tailwindcss-class-sorter", "/tailwindcss-class-sorter/dist/twcs.wasm"),
	...process.argv.slice(2),
];

const go = new Go();
go.argv = argv /* process.argv.slice(2) */;
go.env = Object.assign({ TMPDIR: require("os").tmpdir() }, process.env);
go.exit = process.exit;
WebAssembly.instantiate(fs.readFileSync(argv[0] /* process.argv[2] */), go.importObject).then((result) => {
	process.on("exit", (code) => { // Node.js exits if no event handler is pending
		if (code === 0 && !go.exited) {
			// deadlock, make Go print error and stack traces
			go._pendingEvent = { id: 0 };
			go._resume();
		}
	});
	return go.run(result.instance);
}).catch((err) => {
	console.error(err);
	process.exit(1);
});
