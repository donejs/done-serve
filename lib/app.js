const path = require("path");
const stack = require("./stack");


const compression = require("./middleware/compression");
const notFound = require("./middleware/not-found");
const proxy = require("./middleware/proxy");
const serveIndex = require('serve-index');
const serveStatic = require("serve-static");
const staticErrorPage = require("./middleware/static-errorpage");
const staticPushstate = require("./middleware/static-pushstate");

module.exports = function (options) {
	let layers = [
		compression()
	];

	if(options.proxy) {
		layers.push(proxy(options.proxy, options));
	}
	
	let staticOptions = { index: options.index };
	layers.push(serveStatic(path.join(options.path), staticOptions));

	// Allow the layers to be configured (added to).
	if(options.configure) {
		options.configure(layers);
	}

	if(!options.static) {
		let steal = {
			config: path.join(options.path, 'package.json') + '!npm',
			liveReload: options.liveReload
		};

		if(options.main) {
			steal.main = options.main;
		}

		var ssrMiddleware = options.ssr || require("./middleware/ssr");
		layers.push(ssrMiddleware(steal, options));
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
