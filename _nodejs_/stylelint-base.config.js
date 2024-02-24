/** @type {import("stylelint").Config} */
export default {
	"extends": [],
	"plugins": ["stylelint-order"],
	"processors": [],
	"ignoreFiles": [
		"**/.git",
		"**/.svn",
		"**/.hg",
		"**/CVS",
		"**/node_modules",
		"**/vendor",
		"**/.env",
		"**/.venv",
		"**/env",
		"**/venv",
		"**/ENV",
		"**/env.bak",
		"**/venv.bak",
		"**/__pycache__",
	],
	"rules": {},
	"overrides": [],
}
