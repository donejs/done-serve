var mochas = require("spawn-mochas");

mochas([
	"cli_test.js",
	"server_test.js",
	"server_path_test.js",
	"cookie_server_test.js",
	"done-serve_test.js",
	"timeout_test.js"
], __dirname);
