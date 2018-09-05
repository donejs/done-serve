
module.exports = function(port, options) {
	let createApp = require("./app");
	let createServers = require("./servers").create;

	let app = createApp(options);
	let [mainServer] = createServers(port, options, app);

	return mainServer;
};
