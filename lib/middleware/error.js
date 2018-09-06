const errorFormat = require('donejs-error-format');

module.exports = function(options) {
	return function(error, request, response) {
		let parts = errorFormat.extract(error);
		let errorOptions = {
			liveReload: !!options.liveReload
		};
		let html = errorFormat.html(parts, errorOptions);

		if(options.logErrors !== false) {
			console.log('\033c');
			console.error(error.stack);
		}

		response.writeHead(500, {
			"content-type": "text/html",
			"content-length": Buffer.byteLength(html)
		});

		response.end(html);
	};
};
