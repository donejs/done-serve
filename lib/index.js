var path = require('path');

var compression = require('compression');
var express = require('express');
var debug = require('debug')('done-serve');
var middleware = require('done-ssr-middleware');

var proxy = require('./proxy');

function notFoundHandler(req, res, next) {
	res.status(404);
	next(new Error('File not found'));
}

module.exports = function (options) {
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
		var system = {
			config: path.join(options.path, 'package.json') + '!npm',
			liveReload: options.liveReload
		};

		if(options.main) {
			system.main = options.main;
		}

		var mw = middleware(system, options);

		debug('Registering done-ssr-middleware');
		app.use(mw);
	} else {
		app.use(notFoundHandler);

		if(options.errorPage) {
			var filename = path.join(process.cwd(), options.errorPage);
			
			debug('Registering pushState file', filename);

			app.use(function(err, req, res, next) {
				debug('Pushstate error handler', filename);
				res.status(200);
				res.sendFile(filename);
			});
		}
	}

	return app;
};
