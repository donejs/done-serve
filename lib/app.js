/*
var path = require('path');

var chalk = require('chalk');
var compression = require('compression');
var errorFormat = require('donejs-error-format');
var express = require('express');
var serveIndex = require('serve-index');
var debug = require('debug')('done-serve');
var middleware = require('done-ssr-middleware');
var fs = require('fs');

var proxy = require('./proxy');
*/


const path = require("path");
const stack = require("./stack");

const compression = require("./middleware/compression");
const proxy = require("./middleware/proxy");
const serveStatic = require("serve-static");
const ssr = require("./middleware/ssr");
const notFound = require("./middleware/not-found");

module.exports = function (options) {
	let layers = [
		compression
	];

	if(options.proxy) {
		layers.push(proxy(options.proxy, options));
		//layers.push(proxy({...options}))
	}

	debugger;
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
		// TODO
	}



	// 404s
	layers.push(notFound);

	let app = stack(layers);
	return app;

	// Old code below ↓

	/*

	var app = express()
	.use(compression());

	debug('Initializing done-serve application', options);

	if (options.configure) {
		options.configure(app);
	}

	if (options.proxy) {
		proxy(app, options);
	}

	app.use(express.static(path.join(options.path)));

	if(!options.static) {
		var steal = {
			config: path.join(options.path, 'package.json') + '!npm',
			liveReload: options.liveReload
		};

		if(options.main) {
			steal.main = options.main;
		}

		var mw = middleware(steal, options);

		debug('Registering done-ssr-middleware');
		app.use(mw);

		// Error handler
		app.use(function(error, request, response, next) {
			var parts = errorFormat.extract(error);
			var errorOptions = {
				liveReload: !!options.liveReload
			};
			var html = errorFormat.html(parts, errorOptions);

			if(options.logErrors !== false) {
				console.log('\033c');
				console.error(error.stack);
			}

			response.status(500).type('html').end(html);
		});
	} else {
		// Unobtrusively handle pushstate routing when SSR is turned off.
		app.get('*', function (req, res, next) {
			var urlParts = path.parse(req.url);
			var isPushstateRoute = !urlParts.ext || urlParts.name.includes('?');
			if (isPushstateRoute) {
				var env = process.env.NODE_ENV || 'development';
				var htmlPath = path.join(options.path, './' + env + '.html');
				if (!fs.existsSync(htmlPath)) {
					htmlPath = path.join(options.path, './production.html');
				}
				if (fs.existsSync(htmlPath)) {
					return res.sendFile(htmlPath);
				}
			}
			return next();
		});

		app.use(serveIndex(path.join(options.path), { icons: true }));
		app.use(notFoundHandler);

		if(options.errorPage) {
			var filename = path.join(process.cwd(), options.errorPage);

			debug('Registering pushState file', filename);

			app.use(function(err, req, res, next) {
				debug('Pushstate error handler', filename);
				res.status(200);
				res.sendFile(filename);
			});
		} else {
			app.use(function(err, req, res, next) {
				if(res.statusCode === 404) {

					console.error(`${chalk.red('404')} ${chalk.yellow.bgBlackBright.bold(' ' + req.url + ' ')}`);
					res.writeHead(404);
					res.end('Not found.');
				} else {
					next(err);
				}
			});
		}
	}

	return app;
	*/
};
