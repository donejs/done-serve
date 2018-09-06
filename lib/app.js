const path = require("path");
const stack = require("./stack");


const compression = require("./middleware/compression");
const notFound = require("./middleware/not-found");
const proxy = require("./middleware/proxy");
const serveIndex = require('serve-index');
const serveStatic = require("serve-static");
const ssr = require("./middleware/ssr");
const staticErrorPage = require("./middleware/static-errorpage");
const staticPushstate = require("./middleware/static-pushstate");

module.exports = function (options) {
	let layers = [
		compression()
	];

	if(options.proxy) {
		layers.push(proxy(options.proxy, options));
		//layers.push(proxy(options.proxy, options, "/socket.io/"));
	}

	layers.push(serveStatic(path.join(options.path)));

	if(!options.static) {
		let steal = {
			config: path.join(options.path, 'package.json') + '!npm',
			liveReload: options.liveReload
		};

		if(options.main) {
			steal.main = options.main;
		}

		layers.push(ssr(steal, options));
	} else {
		layers.push(staticPushstate(options));
		layers.push(serveIndex(path.join(options.path), { icons: true }));

		if(options.errorPage) {
			layers.push(staticErrorPage(options));
		}
	}

	// 404s
	layers.push(notFound);

	const app = stack(layers);
	return app;
};
